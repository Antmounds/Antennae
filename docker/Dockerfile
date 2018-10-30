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

ARG BUILD
ARG BUILD_DATE
ARG METEOR_SETTINGS
ARG MONGO_URL=mongodb://mongo/antennae
ARG PORT=3000
ARG RELEASE
ARG VCS_REF
ARG VERSION=1.0

LABEL app="Antennae" license="AGPLv3" maintainer="gitlab.com/Antmounds" org.label-schema.build-date=$BUILD_DATE org.label-schema.name="Antennae" org.label-schema.description="Free, open-source, mobile-ready, face-recognition, check-in and loyalty app" org.label-schema.url="http://getAntennae.com" org.label-schema.vcs-url="https://gitlab.com/Antmounds/Antennae" org.label-schema.vcs-ref=$VCS_REF org.label-schema.vendor="Antmounds" org.label-schema.release="$RELEASE" org.label-schema.version="$VERSION" org.label-schema.schema-version="1.0"

ENV PORT=$PORT ROOT_URL=http://localhost:$PORT MONGO_URL=$MONGO_URL NODE_ENV=production BUILD=$BUILD METEOR_SETTINGS=$METEOR_SETTINGS RELEASE=$RELEASE VERSION=$VERSION

WORKDIR /app/

COPY --from=INSTALL /build .

EXPOSE $PORT

USER guest

CMD [ "node", "main.js" ]