FROM node:18.12.1-alpine3.15 as ts-builder

ENV BUILD_DIR /usr/local/src/build
WORKDIR ${BUILD_DIR}

COPY package*.json tsconfig.json .npmrc ./
COPY src ./src
RUN apk --no-cache --virtual build-dependencies add python3 make g++ 
RUN npm ci
