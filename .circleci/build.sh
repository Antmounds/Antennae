#!/bin/bash


# build meteor app if flag is set
if [[ $* == --meteor ]]; then
	# Build meteor app
	cd src/
	meteor build --directory ../build
	cd ../
fi

# build the Docker image (this will use the Dockerfile in the root of the repo)
docker build -t antennae --build-arg BUILD="dev-$(date '+%Y-%m-%d_%H:%M:%S')" --build-arg METEOR_SETTINGS="$(cat src/tools/settings.json)" .
exit 0;



# docker run -d --rm -P --name ant --link mongo:mongo -e MONGO_URL=$MONGO_URL -e AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID -e AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY antmounds/antennae