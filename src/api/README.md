# api

## Description

HTTP REST API which provides API endpoints to access data about contracts and tokens metadata.
The API exposes data from MongoDB and S3 bucket.

---

## Local launch

```shell
$ npm i
$ npm run start:mongo
$ npm run api
```

---

## Access

### Access API

Replace `8090` with a value which was specified in `.env` file for `APP_PORT`:

- http://localhost:8090/v1/api/health

### Access Swagger OpenAPI docs:

Replace `8090` with a value which was specified in `.env` file for `APP_PORT`:

- http://localhost:8090/swagger-api/#/

---

## How to test

### Run all tests locally

```shell
$ npm run start:mongo
$ npm run test <you can specify a specific test file to run>
```

### Run all tests in Docker

```shell
$ npm run test:docker
```

###

A lot of tests use snapshots to compare results. If tests have changed and snapshots need to be recreated, then you need to use a special flag for this:

```shell
$ npm run test -- -u
```

---

## Dependencies

### Nestjs dependencies

#### Nest Overview

Nest (NestJS) is a framework for building efficient, scalable Node.js server-side applications. It uses progressive JavaScript, is built with and fully supports TypeScript (yet still enables developers to code in pure JavaScript) and combines elements of OOP (Object Oriented Programming), FP (Functional Programming), and FRP (Functional Reactive Programming).
See [nestjs](https://docs.nestjs.com/)

- [@nestjs/common](https://www.npmjs.com/package/@nestjs/common)
- [@nestjs/config](https://www.npmjs.com/package/@nestjs/config)
- [@nestjs/platform-express](https://www.npmjs.com/package/@nestjs/platform-express)
- [@nestjs/core](https://www.npmjs.com/package/@nestjs/platform-express)

### Other dependencies

- [mongodb](https://www.npmjs.com/package/mongodb) - the official MongoDB driver for Node.js;
- [pino](https://www.npmjs.com/package/pino) - pino logger;

