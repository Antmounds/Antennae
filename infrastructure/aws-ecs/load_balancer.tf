## Load Balancers
resource "aws_alb" "web_app" {
  name                       = "${var.app_name}-alb-tf"
  subnets                    = ["${aws_subnet.public.*.id}"]
  security_groups            = ["${aws_security_group.web_app_sg.id}"]
  enable_deletion_protection = false

  tags {
    Name        = "${var.app_name}-alb-tf"
    Description = "Application Load Balancer managed by Terraform"
    Environment = "${var.environment}"
    Creator     = "terraform"
    Team        = "DevOps"
    Owner       = "Antmounds"
    terraform   = true
  }
}

resource "aws_alb_listener" "web_app" {
  load_balancer_arn = "${aws_alb.web_app.arn}"
  port              = "80"
  protocol          = "HTTP"
  depends_on        = ["aws_alb_target_group.app_target_group_hot"]

  default_action {
    target_group_arn = "${aws_alb_target_group.app_target_group_hot.arn}"
    type             = "forward"
  }
}

## Security Group for ALB
resource "aws_security_group" "web_app_sg" {
  name        = "tf-sg-${lower(var.app_name)}-web-app-alb"
  description = "Allow HTTP from Anywhere into ALB"
  vpc_id      = "${aws_vpc.main.id}"

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "icmp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags {
    Name        = "tf-sg-${lower(var.app_name)}-web-app-alb"
    Description = "Security Group for Application Load Balancer managed by Terraform"
    Creator     = "terraform"
    Team        = "DevOps"
    Owner       = "Antmounds"
  }
}
