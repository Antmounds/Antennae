########################################################################################
#
# HOT (LIVE) VERSION
#
########################################################################################
resource "aws_alb_target_group" "app_target_group_hot" {
  name                 = "tf-alb-tg-${var.app_name}-${var.app_version_hot}-${replace(substr(local.localtime,11,6),".","")}"
  port                 = 3000
  protocol             = "HTTP"
  vpc_id               = "${aws_vpc.main.id}"
  target_type          = "instance"
  deregistration_delay = 30

  health_check {
    interval = 10
    path     = "/"
    port     = "traffic-port"
    protocol = "HTTP"
    timeout  = 5
    matcher  = 200
  }

  lifecycle {
    create_before_destroy = true
    ignore_changes        = ["name"]
  }

  tags {
    Name        = "TG-${var.environment}-${var.app_name}-${var.app_version_warm}"
    Description = "target group for ecs tasks"
    Creator     = "terraform"
    Owner       = "Antmounds"
    terraform   = true
  }
}

resource "aws_lb_listener_rule" "host_based_routing_hot" {
  listener_arn = "${aws_alb_listener.web_app.arn}"
  priority     = 20

  action {
    type             = "forward"
    target_group_arn = "${aws_alb_target_group.app_target_group_hot.arn}"
  }

  condition {
    field  = "host-header"
    values = ["app.getantennae.com"]
  }
}

data "template_file" "container_definition_hot" {
  template = "${file("${path.module}/container-definition.json")}"

  vars {
    image_url         = "${var.repo_url}:${var.app_version_hot}"
    container_name    = "${var.app_name}-${var.app_version_hot}"
    log_group_region  = "${var.region}"
    log_group_name    = "${var.app_name}"
    log_stream_prefix = "${var.app_version_hot}"
  }
}

resource "aws_ecs_task_definition" "app_task_hot" {
  family                   = "${var.app_name}-${var.app_version_hot}"
  container_definitions    = "${data.template_file.container_definition_hot.rendered}"
  cpu                      = 200
  memory                   = 200
  network_mode             = "bridge"
  requires_compatibilities = ["${var.launch_type}"]

  #execution_role_arn       = "${aws_iam_role.ecs_execution_role.arn}"
  #task_role_arn            = "${aws_iam_role.ecs_execution_role.arn}"
}

resource "aws_ecs_service" "app_service_hot" {
  name                               = "${var.app_name}-${var.app_version_hot}"
  cluster                            = "${aws_ecs_cluster.app_cluster.arn}"
  task_definition                    = "${aws_ecs_task_definition.app_task_hot.arn}"
  desired_count                      = "${var.app_version_hot_count}"
  launch_type                        = "${var.launch_type}"
  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent         = 200
  health_check_grace_period_seconds  = 60

  #iam_role        = "${aws_iam_role.ecs_execution_role.name}"

  load_balancer {
    target_group_arn = "${aws_alb_target_group.app_target_group_hot.arn}"
    container_name   = "${var.app_name}-${var.app_version_hot}"
    container_port   = "3000"
  }
  #network_configuration {
  #security_groups  = ["${aws_security_group.web_app_sg.id}"]
  #subnets          = ["${aws_subnet.public.*.id}"]
  #assign_public_ip = false
  #}
  depends_on = [
    "aws_iam_role_policy.ecs",
    "aws_alb_listener.web_app",
    "aws_lb_listener_rule.host_based_routing_hot",
    "aws_alb_target_group.app_target_group_hot",
  ]
}

########################################################################################
#
# WARM (NEXT) VERSION
#
########################################################################################
resource "aws_alb_target_group" "app_target_group_warm" {
  name                 = "tf-alb-tg-${var.app_name}-${var.app_version_warm}-${replace(substr(local.localtime,11,6),".","")}"
  port                 = 3000
  protocol             = "HTTP"
  vpc_id               = "${aws_vpc.main.id}"
  target_type          = "instance"
  deregistration_delay = 30

  lifecycle {
    create_before_destroy = true
    ignore_changes        = ["name"]
  }

  tags {
    Name        = "TG-${var.environment}-${var.app_name}-${var.app_version_warm}"
    Description = "target group for ecs tasks"
    Creator     = "terraform"
    Owner       = "Antmounds"
    terraform   = true
  }
}

resource "aws_lb_listener_rule" "host_based_routing_warm" {
  listener_arn = "${aws_alb_listener.web_app.arn}"
  priority     = 30

  action {
    type             = "forward"
    target_group_arn = "${aws_alb_target_group.app_target_group_warm.arn}"
  }

  condition {
    field  = "host-header"
    values = ["new.getantennae.com"]
  }
}

data "template_file" "container_definition_warm" {
  template = "${file("${path.module}/container-definition.json")}"

  vars {
    image_url         = "${var.repo_url}:${var.app_version_warm}"
    container_name    = "${var.app_name}-${var.app_version_warm}"
    log_group_region  = "${var.region}"
    log_group_name    = "${var.app_name}"
    log_stream_prefix = "${var.app_version_warm}"
  }
}

resource "aws_ecs_task_definition" "app_task_warm" {
  family                   = "${var.app_name}-${var.app_version_warm}"
  container_definitions    = "${data.template_file.container_definition_warm.rendered}"
  cpu                      = 200
  memory                   = 200
  network_mode             = "bridge"
  requires_compatibilities = ["${var.launch_type}"]

  #execution_role_arn       = "${aws_iam_role.ecs_execution_role.arn}"
  #task_role_arn            = "${aws_iam_role.ecs_execution_role.arn}"
}

resource "aws_ecs_service" "app_service_warm" {
  name                               = "${var.app_name}-${var.app_version_warm}"
  cluster                            = "${aws_ecs_cluster.app_cluster.arn}"
  task_definition                    = "${aws_ecs_task_definition.app_task_warm.arn}"
  desired_count                      = "${var.app_version_warm_count}"
  launch_type                        = "${var.launch_type}"
  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent         = 200
  health_check_grace_period_seconds  = 60

  #iam_role        = "${aws_iam_role.ecs_execution_role.name}"

  load_balancer {
    target_group_arn = "${aws_alb_target_group.app_target_group_warm.arn}"
    container_name   = "${var.app_name}-${var.app_version_warm}"
    container_port   = "3000"
  }
  depends_on = [
    "aws_iam_role_policy.ecs",
    "aws_alb_listener.web_app",
    "aws_lb_listener_rule.host_based_routing_hot",
    "aws_alb_target_group.app_target_group_hot",
  ]
}
