resource "aws_internet_gateway" "default" {
  vpc_id = "${aws_vpc.main.id}"
}

resource "aws_nat_gateway" "nat" {
  #allocation_id = "${aws_eip.nat.id}"
  count     = 0
  subnet_id = "${element(aws_subnet.public.*.id, 0)}"

  tags {
    Name        = "ng-1"
    Description = "NAT gateway managed by Terraform"
    Creator     = "terraform"
    Owner       = "Antmounds"
    terraform   = true
  }

  depends_on = ["aws_internet_gateway.default"]
}

## Public subnets

resource "aws_subnet" "public" {
  count                   = 3                                                                      #"${length(data.aws_availability_zones.available.names)}"
  vpc_id                  = "${aws_vpc.main.id}"
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = "${element(data.aws_availability_zones.available.names, count.index)}"
  map_public_ip_on_launch = true

  tags {
    Name        = "publicSN-${element(data.aws_availability_zones.available.names, count.index)}-${var.vpc_name}"
    Description = "public subnet for VPC - ${var.vpc_name}"
    Creator     = "terraform"
    Owner       = "Antmounds"
    terraform   = true
  }

  depends_on = ["aws_internet_gateway.default"]
}

## Public Subnets Routing Table

resource "aws_route_table" "public-routes" {
  vpc_id = "${aws_vpc.main.id}"

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = "${aws_internet_gateway.default.id}"
  }

  tags {
    Name        = "publicSN-routes"
    Description = "public routes for VPC - ${var.vpc_name}"
    Creator     = "terraform"
    Owner       = "Antmounds"
    terraform   = true
  }

  #depends_on = ["aws_subnet.public"]
}

resource "aws_route_table_association" "public" {
  count          = "${aws_subnet.public.count}"
  subnet_id      = "${element(aws_subnet.public.*.id, count.index)}"
  route_table_id = "${aws_route_table.public-routes.id}"

  depends_on = ["aws_route_table.public-routes"]
}

## Private subnets

resource "aws_subnet" "private" {
  count                   = 0                                                                      #"${length(data.aws_availability_zones.available.names)}"
  vpc_id                  = "${aws_vpc.main.id}"
  cidr_block              = "10.0.${count.index + aws_subnet.public.count + 1}.0/24"
  availability_zone       = "${element(data.aws_availability_zones.available.names, count.index)}"
  map_public_ip_on_launch = false

  tags {
    Name        = "privateSN-${element(data.aws_availability_zones.available.names, count.index)}-${var.vpc_name}"
    Description = "private subnets for VPC - ${var.vpc_name}"
    Creator     = "terraform"
    Owner       = "Antmounds"
    terraform   = true
  }

  depends_on = ["aws_internet_gateway.default"]
}

## Private Subnets Routing Table

resource "aws_route_table" "private-routes" {
  vpc_id = "${aws_vpc.main.id}"
  count  = "${aws_subnet.private.count}"

  route {
    cidr_block = "0.0.0.0/0"

    #instance_id = "${aws_instance.nat.id}"
    nat_gateway_id = "${aws_nat_gateway.nat.id}"
  }

  tags {
    Name        = "privateSN-routes-${var.vpc_name}"
    Description = "private routes for VPC - ${var.vpc_name}"
    Creator     = "terraform"
    Owner       = "Antmounds"
    terraform   = true
  }

  depends_on = ["aws_subnet.private"]
}

resource "aws_route_table_association" "private" {
  count          = "${aws_subnet.private.count}"
  subnet_id      = "${element(aws_subnet.private.*.id, count.index)}"
  route_table_id = "${aws_route_table.private-routes.id}"

  depends_on = ["aws_route_table.private-routes"]
}
