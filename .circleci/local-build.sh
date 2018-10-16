#!/bin/bash


IMAGE_URI=166964003196.dkr.ecr.us-east-1.amazonaws.com/antennae

# Build meteor app
cd src/
#meteor npm install --production --save bcrypt fibers
meteor build --directory ../build
cd ../
#(cd build/bundle/programs/server && npm install --production)

# Removed gitignored files
git clean -Xdf build

# build the Docker image (this will use the Dockerfile in the root of the repo)
docker build --rm -f docker/Dockerfile -t antennae --build-arg BUILD="dev-$(date '+%Y-%m-%d_%H:%M:%S')" --build-arg METEOR_SETTINGS="$(cat src/tools/settings.json)" --build-arg VERSION="0.9" .

# tag for AWS ECR
docker tag antennae $IMAGE_URI:dev

# login to AWS ECR
$(aws ecr get-login --no-include-email --region us-east-1)

docker push $IMAGE_URI:dev

echo 'build & push successful'

exit 0;