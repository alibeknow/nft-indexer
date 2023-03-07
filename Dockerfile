#
# Base stage.
# This stage install dependencies and compiles our TypeScript to get the JavaScript code
#
FROM node:18.12.1-alpine3.15 as ts-builder

ENV BUILD_DIR /usr/local/src/build
WORKDIR ${BUILD_DIR}

COPY package*.json tsconfig.json .npmrc ./
COPY src ./src
RUN npm ci && npm run build

#
# Production stage.
#
FROM node:18.12.1-alpine3.15
LABEL org.opencontainers.image.source https://github.com/ledgerhq/nft-indexer-evm

ENV APP_DIR /usr/local/src/app
ENV BUILD_DIR /usr/local/src/build
ENV NODE_ENV production
WORKDIR ${APP_DIR}

COPY package*.json tsconfig.json paths-overwrite.js ./
COPY --from=ts-builder ${BUILD_DIR}/dist ./dist
COPY --from=ts-builder ${BUILD_DIR}/node_modules ./node_modules
