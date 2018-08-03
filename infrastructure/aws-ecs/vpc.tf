# Configure remote state
terraform {
  required_version = ">=0.11.7"

  backend "s3" {
    bucket = "antmounds"
    key    = "terraform-state/terraform.tfstate"
    region = "us-east-1"
  }
}

# Configure the AWS Provider
provider "aws" {
  region = "${var.region}"
}

# Main VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true

  tags {
    Name        = "${var.vpc_name}"
    Description = "Private Cloud for Colony"
    Creator     = "terraform"
    Owner       = "Antmounds"
  }
}
