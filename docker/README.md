# Supported tags and respective `Dockerfile` links
-	[`2`, `latest` (*Dockerfile*)](https://gitlab.com/Antmounds/Antennae/blob/docker/Dockerfile)
-	[`1`, `lite` (*Dockerfile*)](https://gitlab.com/Antmounds/Antennae/blob/lite/docker/Dockerfile)
-	[`0.9` (*Dockerfile*)](https://gitlab.com/Antmounds/Antennae/blob/lite/docker/Dockerfile)

# Quick reference
-	**Where to get help**:  
	[the Antmounds Community Discord](https://discord.gg/VtFkvSv)

-	**Where to file issues**:  
	[the Antennae GitLab](https://gitlab.com/Antmounds/Antennae/issues)

-	**Maintained by**:  
	[the Antmounds Antennae Team](https://gitlab.com/Antmounds/Antennae)

-	**Published image artifact details**:  
	- [(image metadata, labels, layers, transfer size, tags)](https://microbadger.com/images/antmounds/antennae)
	- [(Quay vulnerability scans)](https://quay.io/repository/antmounds/antennae?tab=tags)  
	
-	**Source of this description**:  
	[repo's `docker/` directory](https://gitlab.com/Antmounds/Antennae/blob/docker) ([history](https://gitlab.com/Antmounds/Antennae/commits/master/docker))

-	**Supported Docker versions**:  
	[the latest release](https://github.com/docker/docker-ce/releases/latest) (down to 1.6 on a best-effort basis)

# What is Antennae?
[![pipeline status](https://gitlab.com/Antmounds/Antennae/badges/develop/pipeline.svg)](https://gitlab.com/Antmounds/Antennae/commits/develop) [![CircleCI](https://circleci.com/gh/Antmounds/antennae.svg?style=svg)](https://circleci.com/gh/Antmounds/antennae) [![](https://images.microbadger.com/badges/image/antmounds/antennae.svg)](https://microbadger.com/images/antmounds/antennae "Get your own image badge on microbadger.com") [![AGPL License](https://img.shields.io/badge/license-AGPL-blue.svg)](http://www.gnu.org/licenses/agpl-3.0) [![Discord Chat](https://img.shields.io/discord/299962468581638144.svg?logo=discord)](https://discord.gg/VtFkvSv)

![Dockerhub stats](http://dockeri.co/image/antmounds/antennae "Official Dockerhub image")

![logo](https://gitlab.com/Antmounds/Antennae/raw/develop/src/public/android-icon-144x144.png)

Antennae is a free and open-source face recognition node.js app using [AWS Rekognition](https://aws.amazon.com/rekognition/) to detect and match faces. The app allows you to create collections of 'face prints' and later search an image across any number of selected databases. Each search will also return detected emotions, gender, estimated age range, and other facial features such as the presence of glasses, face hair and smiles. Use cases include allowing you to easily and quickly find missing persons, helping the visually impaired, verifying dates and rendevouz, recognizing celebrities, victim identificaion, and so much more!

Check-in stand mode allows you to set this up for point-of-sale, self-service checkin/out, vip recognition, loyalty rewards programs and greet returning guests by name. Simply by being recognized, allow guests to enter queues, pre-order, confirm options and view current status from their Antennae app. The dashboard shows all guests and where they were recognized. 

This repo features infrastructure code that will allow you to self-host the application using a containerized, highly available, self-repairing, military grade, secure cloud environment. For a managed SaaS solution check out [Antennae Cloud](https://getantennae.com/cloud), featuring private and pre-populated public face print databases, teams, white-label and 24/7 support options.

Antmounds provides two versions of Antennae: [Antennae](https://gitlab.com/Antmounds/Antennae) and [Antennae Lite](https://gitlab.com/Antmounds/Antennae/tree/lite).

# How to use this image
AWS keys and mongodb url are set at runtime to avoid building secrets into the image. At a minimum, keys must have permissions for *[AWS Rekognition](https://aws.amazon.com/rekognition/)* service. For further usage instructions see [main project repo](https://gitlab.com/Antmounds/Antennae)

##### 1) Set runtime parameters
The following runtime arguments are required:
* `AWS_ACCESS_KEY_ID` - required for AWS access
* `AWS_SECRET_ACCESS_KEY` - required for AWS access
* `MONGO_URL` - required to save face and search metadata

##### 2) Run latest version of app
`docker run --rm -d -P -e AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID} -e AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY} -e MONGO_URL=${MONGO_URL} --name antennae antmounds/antennae`

### Command Description
```bash
docker run \
    --rm \          # removes container after it is stopped
	-d \            # runs container in detached mode
	-P \            # publishes the images exposed port 3000 to a random port on localhost
	-e AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID} \      # set environment variable
	-e AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY} \   # set environment variable
	-e MONGO_URL=${MONGO_URL} \   # set environment variable
	--name antennae \       # name the container whatever you want
	antmounds/antennae   # latest official Antennae image from dockerhub
```

### Docker Compose
##### 1) Create a `docker-compose.yml` file with the following contents:
```
version: '3.6'

services:

  app:
    image: antmounds/antennae
    restart: on-failure
    environment:
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - MONGO_URL=mongodb://mongo/antennae
      - MONGO_OPLOG_URL=mongodb://mongo/local
    ports:
      - 80:3000
    networks:
      - overlay
    depends_on:
      - db

  db:
    image: mongo
    restart: always
    networks:
      overlay:
        aliases:
          - mongo
    command: mongod --config /etc/mongod.conf
    volumes:
      - ./docker/mongod.conf:/etc/mongod.conf
      - ./docker/replicaSet.js:/docker-entrypoint-initdb.d/replicaSet.js

networks:
  overlay:
```
##### 2) Start the services
* `docker-compose up` - starts services
* `docker-compose ps` - view running processes of services

## Where can I run Antennae container images?
You can run Antennae container images in any Docker based environment. Examples include, your laptop, in AWS/GCP/Azure instances and clusters.

## How is Antennae different from Antennae Lite?
There are three major differences in Antennae from its predecessor:

1.	it includes admin/user accounts
2.	it enables check-in by users
3.	it saves images by default for later comparison

## Is Antennae backward compatible with Antennae Lite?
Due to the inclusion of new architecture in Antennae such as user accounts, your applications running on the current version of Antennae may require additional changes to run on Antennae Lite.

## Contributing
Pull requests, forks and stars are mucho appreciated and encouraged. See [CONTRIBUTING.md](https://gitlab.com/Antmounds/Antennae/blob/master/CONTRIBUTING.md) for how to get involved in this project.

- #### Get official Antmounds gear!
	<a href="https://streamlabs.com/Antmounds/#/merch">
		<img src="https://cdn.streamlabs.com/merch/panel8.png" width="160">
	</a>
	<a href="https://shop.spreadshirt.com/Antmounds">
		<img src="https://image.spreadshirtmedia.com/content/asset/sprd-logo_horizontal.svg" width="160">
	</a>

- #### Become a Supporter!
	<a href="https://www.patreon.com/antmounds">
		<img src="https://c5.patreon.com/external/logo/become_a_patron_button@2x.png" width="160">
	</a> 

## Get in touch
* Join the Antmounds [discord](https://discord.gg/VtFkvSv) server for more discussion and support on this project.
* Watch LIVE development of this app on [YouTube](https://www.youtube.com/Antmounds), [Twitch.tv](https://twitch.tv/Antmounds) and [Mixer](https://mixer.com/Antmounds)
* Use the [issue tracker](https://gitlab.com/Antmounds/Antennae/issues) for bugs, feature requests and enhancements
* For serious business inquiries contact [business@antmounds.com](business@antmounds.com)

## Authors
* [Nick@antmounds](https://gitlab.com/Antmounds) - *initial development*

# License
Copyright © 2018-present Antmounds.com, Inc. or its affiliates. All Rights Reserved.

>This program is free software: you can redistribute it and/or modify it under the terms of the [GNU Affero General Public License, version 3](https://www.gnu.org/licenses/agpl-3.0.en.html), as published by the Free Software Foundation.

>This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the [GNU Affero General Public License](https://www.gnu.org/licenses/agpl-3.0.en.html) for more details.

>As with all Docker images, these likely also contain other software which may be under other licenses (such as Bash, etc from the base distribution, along with any direct or indirect dependencies of the primary software being contained).

>As for any pre-built image usage, it is the image user's responsibility to ensure that any use of this image complies with any relevant licenses for all software contained within.