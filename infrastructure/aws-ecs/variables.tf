variable "app_name" {
  type        = "string"
  default     = "Antennae"
  description = "Name of the service/app"
}

variable "app_version_hot" {
  type        = "string"
  default     = "dev"
  description = "Live version of the service/app"
}

variable "app_version_hot_count" {
  type        = "string"
  default     = "3"
  description = "How many containers of the live (hot) version to run"
}

variable "app_version_warm" {
  type        = "string"
  default     = "dev"
  description = "Incoming version of the service/app"
}

variable "app_version_warm_count" {
  type        = "string"
  default     = "2"
  description = "How many containers of the new (warm) version to run"
}

variable "app_version_dev" {
  type        = "string"
  default     = "dev"
  description = "DEV version of the service/app"
}

variable "app_version_dev_count" {
  type        = "string"
  default     = "1"
  description = "How many containers of the dev version to run"
}

variable "app_version_cold" {
  type        = "string"
  default     = "cold"
  description = "Old version of the service/app"
}

variable "app_version_cold_count" {
  type        = "string"
  default     = "1"
  description = "How many containers of the old (cold) version to run"
}

variable "asg_desired_count" {
  type        = "string"
  default     = "1"
  description = "How many instances should back the cluster?"
}

variable "environment" {
  type        = "string"
  default     = "PROD"
  description = "PROD/QA/DEV/TEST"
}

variable "instance_type" {
  type        = "string"
  default     = "t2.small"
  description = "Cluster autoscaling group instance type"
}

variable "launch_type" {
  type        = "string"
  default     = "EC2"
  description = "EC2/FARGATE; what kind of ECS to deploy"
}

variable "region" {
  type        = "string"
  default     = "us-east-1"
  description = "The AWS region to create everything in."
}

variable "repo_url" {
  type        = "string"
  default     = "166964003196.dkr.ecr.us-east-1.amazonaws.com/antennae"
  description = "The url to pull docker images from"
}

variable "spot_price" {
  type        = "string"
  default     = "0.0069"
  description = "If set, spotinstance will be bid for at this price"
}

variable "vpc_name" {
  type        = "string"
  default     = "AntCloud"
  description = "Name of Virtual Private Cloud"
}

locals {
  localtime = "${replace(timeadd(timestamp(), "-6h"),":",".")}"                 # formats timestamp to be more display friendly
  datetime  = "${substr(local.localtime,0,10)}_${substr(local.localtime,11,8)}"
  datehour  = "${substr(local.localtime,0,10)}_${substr(local.localtime,11,2)}"
}

# load availability zones
data "aws_availability_zones" "available" {}
