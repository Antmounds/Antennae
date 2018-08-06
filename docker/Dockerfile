FROM node:alpine as INSTALL

# add prebuilt meteor files
WORKDIR /build

COPY build/bundle .gitignore ./
COPY .git /.git/

# --no-cache: download package index on-the-fly, no need to cleanup afterwards
# --virtual: bundle packages, remove whole bundle at once, when done
RUN apk add --no-cache --update --virtual .gyp \
	    g++ \
	    git \
	    make \
	    python && \
	(cd programs/server && npm install --save --production && npm install --save fibers) && \
# remove files in .gitignore
    git clean -Xdf

FROM node:alpine as DEPLOY

LABEL maintainer="bitbucket.com/Antmounds" license="GPLv3" app="Antennae"

ARG BUILD
ARG METEOR_SETTINGS
ARG MONGO_URL=mongodb://mongo/antennae
ARG PORT=3000

ENV PORT=$PORT ROOT_URL=http://localhost:$PORT MONGO_URL=$MONGO_URL NODE_ENV=production BUILD=$BUILD METEOR_SETTINGS=$METEOR_SETTINGS

WORKDIR /app/

COPY --from=INSTALL /build .

EXPOSE $PORT

USER node

CMD [ "node", "main.js" ]