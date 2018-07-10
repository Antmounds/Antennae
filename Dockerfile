FROM node:alpine

LABEL maintainer="bitbucket.com/Antmounds" license="GPLv3"

ARG BUILD
ARG MONGO_URL

ENV PORT=3000 ROOT_URL=http://localhost:$PORT MONGO_URL=$MONGO_URL NODE_ENV=development BUILD=$BUILD

# OS update
RUN apk update && apk upgrade

# --no-cache: download package index on-the-fly, no need to cleanup afterwards
# --virtual: bundle packages, remove whole bundle at once, when done
RUN apk add --no-cache --virtual .gyp \
    python \
    make \
    g++

# add prebuilt meteor files
WORKDIR /app/

COPY build/bundle .

RUN (cd programs/server && npm install && npm install --save bcrypt fibers)

EXPOSE $PORT

USER node

CMD [ "node", "main.js" ]