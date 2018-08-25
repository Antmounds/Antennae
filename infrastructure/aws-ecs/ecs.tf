#################################################################
#
#  ECS cluster & Log group to run our services
#
#################################################################

resource "aws_ecs_cluster" "app_cluster" {
  name = "${var.app_name}_${upper(var.environment)}"
}

resource "aws_cloudwatch_log_group" "app_log_groups" {
  name = "${var.app_name}"

  retention_in_days = 30
}

#################################################################
#
#  IAM Roles for ECR and task permissions
#
#################################################################
resource "aws_iam_role" "ecs_service_role" {
  name = "tf-ecs-service-role"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole",
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_role_policy" "ecs" {
  name = "TfEcsClusterRole"
  role = "${aws_iam_role.ecs_service_role.id}"

  #policy = "${data.template_file.instance_profile.rendered}"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
EOF
}

resource "aws_iam_role" "ecs_task_role" {
  name = "tf-ecs-task-role"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "",
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy" "ecs-task" {
  name = "TfEcsTaskRole"
  role = "${aws_iam_role.ecs_task_role.id}"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "",
      "Effect": "Allow",
      "Action": [
        "rekognition:*"
      ],
      "Resource": "*"
    }
  ]
}
EOF
}
