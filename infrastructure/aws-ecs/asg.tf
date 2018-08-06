#provider "aws" {
#  region = "${var.region}"
#}

# load available public subnet ids
#data "aws_subnet_ids" "public" {
#  vpc_id = "${data.aws_vpc.main.id}"
#
# tags {
#    Tier = "WEB"
#  }
#}

# Get the latest Ubuntu AMI
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-xenial-16.04-amd64-server-*"]
  }
}

# Get the latest ECS Optimized Linux 2 AMI
data "aws_ami" "linux" {
  most_recent = true
  owners      = ["amazon"] # Amazon

  filter {
    name   = "name"
    values = ["amzn-ami-*-amazon-ecs-optimized"]
  }
}

data "aws_iam_role" "ecs_role" {
  name = "ecsInstanceRole"
}

resource "aws_iam_instance_profile" "ecs_profile" {
  name = "ecsInstanceProfile"
  role = "${data.aws_iam_role.ecs_role.name}"
}

locals {
  ecs-node-userdata = <<EOF
#!/bin/bash
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
ln -sf /usr/share/zoneinfo/America/Denver /etc/localtime
echo ECS_CLUSTER=${var.app_name}_${upper(var.environment)} >> /etc/ecs/ecs.config
echo ECS_CONTAINER_STOP_TIMEOUT=1m >> /etc/ecs/ecs.config

## Update System
echo "updating system...$(date +%Y-%m-%d_%H:%M:%S)"
yum upgrade -y && yum clean all

#apt-get update && DEBIAN_FRONTEND=noninteractive apt-get -fuy -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" dist-upgrade -y
#reboot
EOF
}

resource "aws_launch_configuration" "ecs_asg_lc" {
  #name = "ECS-${var.environment}-LC_"
  name_prefix = "ECS-${var.environment}-LC"

  associate_public_ip_address = true
  image_id                    = "${var.launch_type == "EC2" ? data.aws_ami.linux.id : data.aws_ami.ubuntu.id}"
  iam_instance_profile        = "ecsInstanceRole"                                                              # "${data.aws_iam_role.ecs-role.arn}"
  instance_type               = "${var.instance_type}"
  key_name                    = "ant"
  enable_monitoring           = true
  ebs_optimized               = false
  spot_price                  = "${var.spot_price}"
  security_groups             = ["${aws_security_group.ecs_asg_sg.id}"]

  root_block_device = {
    volume_type           = "gp2"
    volume_size           = 8
    delete_on_termination = true
  }

  user_data_base64 = "${base64encode(local.ecs-node-userdata)}"

  lifecycle {
    create_before_destroy = true

    #ignore_changes        = ["name"]
  }
}

resource "aws_launch_template" "ecs_asg_lc" {
  name                                 = "ECS-${var.environment}"
  description                          = "Instance template for ECS hosts"
  #disable_api_termination              = true
  image_id                             = "${var.launch_type == "EC2" ? data.aws_ami.linux.id : data.aws_ami.ubuntu.id}"
  instance_type                        = "${var.instance_type}"
  #instance_initiated_shutdown_behavior = "terminate"
  key_name                             = "ant"
  ebs_optimized                        = false
  vpc_security_group_ids               = ["${aws_security_group.ecs_asg_sg.id}"]
  user_data                            = "${base64encode(local.ecs-node-userdata)}"

  iam_instance_profile = {
    arn = "${aws_iam_instance_profile.ecs_profile.arn}"
  }

  instance_market_options {
    market_type = "spot"

    spot_options {
      block_duration_minutes = 0
      max_price              = "${var.spot_price}"
    }
  }

  monitoring {
    enabled = true
  }

  lifecycle {
    create_before_destroy = true
  }

  tag_specifications {
    resource_type = "instance"

    tags {
      parent  = "Launch template propogated tag"
      version = "using latest version of template: ECS-${var.environment}"
    }
  }

  tags {
    Name        = "ECS-${var.environment}"
    Description = "New versioned launch templates!"
    Creator     = "terraform"
    Owner       = "Antmounds"
    terraform   = true
  }
}

resource "aws_autoscaling_group" "ecs_asg" {
  name = "tf-ecs-asg-${var.app_name}_${upper(var.environment)}"

  default_cooldown          = 30
  desired_capacity          = "${var.asg_desired_count}"
  min_size                  = 0
  max_size                  = 25
  launch_configuration      = "${aws_launch_configuration.ecs_asg_lc.id}"
  health_check_grace_period = 0
  health_check_type         = "EC2"
  vpc_zone_identifier       = ["${aws_subnet.public.*.id}"]
  enabled_metrics           = ["GroupTotalInstances", "GroupMaxSize", "GroupInServiceInstances", "GroupPendingInstances", "GroupDesiredCapacity", "GroupMinSize", "GroupStandbyInstances", "GroupTerminatingInstances"]

  #launch_template = {
  # id      = "${aws_launch_template.ecs_asg_lc.id}"
  # version = "$$Latest"
  #}

  lifecycle {
    create_before_destroy = true
    ignore_changes        = ["tags"]
  }
  depends_on = ["aws_launch_configuration.ecs_asg_lc"]
  tags = [
    {
      key                 = "Name"
      value               = "ECS Instance - ${var.app_name}_${var.environment} - ${local.datetime}"
      propagate_at_launch = true
    },
    {
      key                 = "Description"
      value               = "This instance is part of an ASG created and managed by Terraform for the ${var.environment} ${var.app_name} environment"
      propagate_at_launch = true
    },
    {
      key                 = "Creator"
      value               = "terraform"
      propagate_at_launch = true
    },
    {
      key                 = "Owner"
      value               = "Antmounds"
      propagate_at_launch = true
    },
    {
      key                 = "terraform"
      value               = true
      propagate_at_launch = true
    },
    {
      key                 = "Launch Configuration"
      value               = "${aws_launch_configuration.ecs_asg_lc.id}"
      propagate_at_launch = true
    },
  ]
}

## Security Group for ASG
resource "aws_security_group" "ecs_asg_sg" {
  name        = "ecs_asg_sg-${var.environment}"
  description = "Allow SSH from Anywhere into an ECS EC2 instance"
  vpc_id      = "${aws_vpc.main.id}"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow SSH from anywhere"
  }

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]

    #self        = true
    description = "Allow communication to all ports from other instances with this group"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags {
    Name        = "esc-asg-sg-${var.environment}"
    Description = "Allow SSH, ICMP and WEB traffic to ecs instances"
    Creator     = "Terraform"
    Team        = "DevOps"
    Owner       = "Antmounds"
    terraform   = true
  }
}
