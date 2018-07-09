# Antennae
Out-the-box face recognition web app for desktop and mobile. *Trust but verify*


## Introduction
Antennae is a free and open-source face recognition node.js app using [AWS Rekognition](https://aws.amazon.com/rekognition/) to detect and match faces. The app allows you to create collections of 'face prints' and later search an image across any number of selected databases. Each search will also return detected emotions, gender, estimated age range, and other facial features such as the presence of glasses, face hair and smiles. Use cases include allowing you to easily and quickly find missing persons, helping the visually impaired, verifying dates and rendevouz, recognizing celebrities, victim identificaion, and so much more! 

This repo features infrastructure code that will allow you to self-host the application using a containerized, highly available, self-repairing, military grade, secure cloud environment. For a managed SaaS solution check out [Antennae Cloud](https://getantennae.com/cloud), featuring private and pre-populated public face print databases, teams, white-label and 24/7 support options.

## Requirements
* **Meteor.js 1.6.13+** 	- Required for development;
* **Node.js 10.5.0+** 		- Required for production w/o docker;
* **Docker 2.0+**			- Required for testing and production; Free, download and more info at https://docs.docker.com/install/
* **MongoDB** 				- Required for production; running meteor locally comes with mongodb
* **Terraform 0.11.7+** 	- For provisioning cloud infrastructure
* **AWS Account** 			- Free; If you don't have one you can get one at https://aws.amazon.com/.

## Instructions
### Clone the repository
`$ git clone https://bitbucket.org/Antmounds/antennae.git && cd Antennae/`

### 1) Development
#### Navigate to src/ directory
`$ cd src/`

#### Run Development App
`$ meteor --settings='settings.json` *App should become available at http://localhost:3000/*
This will allow you to save changes with live reloading of the app in the browser.

### 2) Production
This will build the meteor.js app and then build resulting node.s app as Docker image ready for deployment.

#### Build meteor app
`$ meteor build --directory ../build`

#### Navigate back to root directory
`$ cd ../`

#### Set required MONGO_URL & AWS Environment Variables
```
$ export MONGO_URL=${YOUR_MONGODB_URI}
$ export AWS_ACCESS_KEY_ID=${YOUR_AWS_ACCESS_KEY}
$ export AWS_SECRET_ACCESS_KEY=${YOUR_AWS_SECRET_KEY}
```

#### Build docker image
`$ docker build -t antmounds/antennae .` *Alternatively run `.circleci/build.sh`. See script for details*

#### Run Production App
`$ docker run --rm -d --name antennae -p 3000:3000 antmounds/antennae:latest` *App should become available at http://localhost:3000/*
The app is ready to be deployed to a hosted docker runtime.

## Build Android App
A prebuilt android sdk can be found [here](https://bitbucket.org/Antmounds/antennae/downloads). But these instructions below will show how to build the app yourself.
From the `src/` directory run meteor build command
`$ meteor build android`

## Deployment
This section goes over deploying the docker image to AWS and running it in production with Elastic Container Service ([ECS])(https://aws.amazon.com/ecs)
#### 1) From `infrastructure/` folder, make sure terraform is installed and up-to-date
`$ terraform -v` 

#### 2) Initiate terraform modules
`$ terraform init` 

#### 3) Plan execution
`$ terraform plan` 

#### 4) Deploy resources
`$ terraform apply` 
This will create the following resources:

## Documentation
* Read more about the goals and motivations for this project.
* Follow the getting started guide for basic usage instructions

## Contributing
Pull requests, forks and stars are mucho appreciated and encouraged. See [CONTRIBUTING.md](https://bitbucket.org/Antmounds/antennae.git#CONTRIBUTING) for how to get involved in this project. 

#### Get in touch
* :speaking_head: Join the Antmounds [discord]() server for more discussion on this project.
* :tv: Watch LIVE development of this app on [YouTube](https://www.youtube.com/Antmounds), [Twitch.tv](https://twitch.tv/Antmounds) and [LiveEdu.tv](https://liveedu.tv/Antmounds)
* :clipboard: Use the [issue tracker](https://bitbucket.org/Antmounds/antennae/issues) for bugs, feature requests and enhancements
* :moneybag: For serious business inquiries contact [business@antmounds.com](business@antmounds.com)

## Authors
* [Nick@antmounds](https://bitbucket.org/Antmounds) - *initial development*

## License
Copyright (C) 2018 Antmounds

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License, version 3,
as published by the Free Software Foundation.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
[GNU Affero General Public License](https://www.gnu.org/licenses/agpl-3.0.en.html) for more details.