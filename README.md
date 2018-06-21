# Antennae
Image tagging app using cloud technologies to label photos. 


## Introduction
Ths app serves as a simple demo node.js app using AWS Rekognition to label photos. The 3 categories of labels it applies are scene/object recognition, face detection and content moderation. Scene recognition will apply a maximum of 15 labels to an image. Face detection shows age range, emotions, glasses, smiling and eyes open/closed.

## Requirements
* **Meteor.js 1.6.13+**
* **Docker 2.0+**
* **MongoDB** - Required for production; running meteor locally comes with mongodb
* **Terraform 0.11.7+** - For provisioning cloud infrastructure
* **AWS Account** - Free; If you don't have one you can get one at https://was.amazon.com/.

## Instructions
### Clone the repository
`$ git clone https://bitbucket.org/Antmounds/antennae.git && cd Antennae`

### 1) Development
#### Navigate to src/ directory
`$ cd src/`

#### Run Development App
`$ meteor --settings='settings.json` *App should become available at http://localhost:3000/*
This will allow you save changes with live reloading of he app in the browser.

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
`$ docker build -t antmounds/antennae .` *Alternative run `.circleci/build.sh`. See script for details*

#### Run Production App
`$ docker run --rm -d --name antennae -p 3000:3000 antmounds/antennae:latest` *App should become available at http://localhost:3000/*
The app is ready to be deployed to a hosted docker runtime.

## Deployment
This section goes over deploying the docker image to AWS and running it in production with Elastic Container Service [ECS](https://aws.amazon.com/ecs)
#### 1) From `infrastructure/` folder, make sure terraform is installed and up-to-date
`$ terraform -v` 

#### 2) Initiate terraform modules
`$ terraform init` 

#### 3) Plan execution
`$ terraform plan` 

#### 4) Deploy resources
`$ terraform apply` 
This will create the following resources:


## Build Android App
A prebuilt android sdk can be found [here]. But these instructions will show how to build the app yourself.
From the `src/` directory run meteor build command
`$ meteor build android`

## Documentation
* Read more about the goals and motivations for this project.
* Follow the getting started guide for basic usage instructions

## Contributing
Pull requests, forks and stars are mucho appreciated and encouraged. See CONTRIBUTINGS.md for how to get involved in this project. 

#### Get in touch
* :speaking_head: Join the Antmounds [discord]() server for more discussion on this project.
* :tv: Watch LIVE development of this app on [YouTube](https://www.youtube.com/Antmounds), [Twitch.tv](https://twitch.tv/Antmounds) and [LiveEdu.tv](https://liveedu.tv/Antmounds)
* :clipboard: Use the [issue tracker](https://bitbucket.org/Antmounds/antennae/issues) for bugs, feature requests and enhancements
* :moneybag: For serious business inquiries contact [business@antmounds.com](business@antmounds.com)

## Authors
* [Nick@antmounds](https://bitbucket.org/Antmounds) - *initial development*

## License
Copyright (C) 2018 Antmounds

This program is free software: you can redistribute it and/or  modify
it under the terms of the GNU Affero General Public License, version 3,
as published by the Free Software Foundation.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
[GNU Affero General Public License](https://www.gnu.org/licenses/agpl-3.0.en.html) for more details.