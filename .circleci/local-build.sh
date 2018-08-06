#!/bin/bash


# Build meteor app
cd src/
meteor npm install --production --save bcrypt fibers
meteor build --directory ../build
cd ../
#(cd build/bundle/programs/server && npm install --production)

# Removed gitignored files
git clean -Xdf build

# build the Docker image (this will use the Dockerfile in the root of the repo)
docker build --rm -f docker/Dockerfile -t antennae --build-arg BUILD="dev-$(date '+%Y-%m-%d_%H:%M:%S')" --build-arg METEOR_SETTINGS="$(cat src/tools/settings.json)" .

docker image prune -f

exit 0;