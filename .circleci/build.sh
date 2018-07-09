#!/bin/bash

IMAGE_NAME=$1
AWS_IMAGE_NAME=$2
# build meteor app if flag is set
if [[ $* == --meteor ]]; then
	# Build meteor app
	cd src/
	meteor build --directory ../build
	cd ../
fi

# build the Docker image (this will use the Dockerfile in the root of the repo)
docker build -f Dockerfile-test -t $IMAGE_NAME --build-arg BUILD=2468 --build-arg MONGO_URL=$MONGO_URL --build-arg AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID --build-arg AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY .
exit;
# authenticate with the AWS ECR registry
$(aws ecr get-login --no-include-email --region us-east-1)
# tag Docker image for the AWS ECR registry
docker tag $IMAGE_NAME $AWS_IMAGE_NAME
# push the new Docker image to the AWS ECR registry
docker push $AWS_IMAGE_NAME