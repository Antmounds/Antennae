# output VPC, availability zones and CIDR blocks

output "VPC ID" {
  value = "${aws_vpc.main.id}"
}

output "VPC cidr" {
  value = "${aws_vpc.main.cidr_block}"
}

output "Zones" {
  value = "${data.aws_availability_zones.available.names}"
}

#output "ECR Repo URL" {
#  value = "${aws_ecr_repository.app_repo.repository_url}"
#}

output "ALB DNS" {
  value = "${aws_alb.web_app.dns_name}"
}

output "Launch Template" {
  value = "${aws_launch_template.ecs_asg_lc.name}: ${aws_launch_template.ecs_asg_lc.latest_version}"
}
