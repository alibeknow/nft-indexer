# nft-indexer-evm [![NFT Indexer EVM](https://github.com/LedgerHQ/nft-indexer-evm/actions/workflows/ci.yaml/badge.svg?branch=main)](https://github.com/LedgerHQ/nft-indexer-evm/actions/workflows/ci.yaml)
***
## Description
NFT Indexer for evm compatible chains. The main goal of the NFT Indexer is to get all the NFT tokens present in the blockchain and their metadata. 
***
## Table of contents
- [Requirements](#requirements)
- [Setup](#setup)
- [Components of the NFT Indexer](#components-of-the-nft-indexer)
- [NPM Scripts](#npm-scripts)
- [MongoDB](#mongodb)
- [Jupyter](#jupyter)
  - [CSV](#csv)
  - [Jupyter Notebook](#jupyter-notebook)
- [Gatling.io load & performance testing](./test/benchmark/gatling/README.md)
***
## Requirements
- Node.js 18.12 LTS (For Node.js version management use [n](https://github.com/tj/n) or [nvm](https://github.com/nvm-sh/nvm))
- NPM 8+
***
## Setup
- `git clone git@github.com:LedgerHQ/nft-indexer-evm.git`
- `cd nft-indexer-evm`
- `npm install`
***
## Components of the NFT Indexer
The process of indexing NFT tokens and fetching their metadata is divided into 4 stages. In our case, 4 components (applications) are responsible for this:
- [api ⇗](./src/api/README.md) - HTTP REST API
- [app-events-reader ⇗](./src/app-events-reader/README.md) - fetches all transfer events from the blockchain;
- [app-indexer ⇗](./src/app-indexer/README.md) - pulls contracts from previously received transfer events;
- [app-contract-reader ⇗](./src/app-contract-reader/README.md) - processes previously received contracts and extracts a token URI from them;
- [app-metadata-reader ⇗](./src/app-metadata-reader/README.md) - pulls token metadata from previously obtained token URIs;
***
## NPM scripts
Each NPM script is responsible for launching the processes associated with the above components. Here is the entire list of used NPM scripts:
- `npm run api` - to run API in development mode with live reload;
- `npm run api:docker` - to run API inside Docker container;
- `npm run app-events-reader` - to run Events Reader (based on Nest.js);
- `npm run app-events-reader:docker` - to run Events Reader inside Docker container;
- `npm run app-indexer` - to run the Indexer with node events (based on Nest.js), for details look at [package.json](./package.json);
- `npm run app-indexer:docker` - to run the Indexer inside Docker container;
- `npm run app-contract-reader` - to run the Contract Reader;
- `npm run app-contract-reader:docker` - to run the Contract Reader inside Docker container;
- `npm run metadata-reader` - to run Metadata Reader;
- `npm run metadata-reader:queue` - to run Metadata Reader that works with queues;
- `npm run metadata-reader:docker` - to run Metadata Reader inside Docker container;
- `npm run metadata-reader:docker:queue` - to run Metadata Reader that works with queues inside Docker container;
- `npm run build` - to transpile TS to JS files;
- `npm test` - to run all Jest tests;
- `npm test:unit` - to run Jest unit tests;
- `npm run test:docker` - to run all types of tests in Docker;
- `npm run test:benchmark` - to run Jest benchmark tests;
- `npm run lint` - to run Eslint checks;
- `npm run lint:fix` - to run Eslint check and fix detected problems;
- `npm run start:docker` - to start all components of the system with MongoDB, Grafana and Prometheus in Docker containers;
- `npm run stop:docker` - to stop all components of the system with MongoDB, Grafana and Prometheus in Docker containers;
- `npm run start:mongo` - to start just a single mongodb service from docker-compose;
- `npm run start:rabbit` - to start just a single rabbitmq service from docker-compose;
***

## MongoDB

For local development we provision MongoDB via docker-compose.
Fot details look at [docker-compose.yaml](./docker-compose.yaml).  
What specific collections each component works with can be seen in the documentation assigned to each component.
***
## Jupyter

### CSV
To generate CSV files containing application metrics we use Python script.  
Proceed to `statisctics` folder and run `python3 exportcsv.py <prometheus_url>`. Use real URL instead of the last argument.  

### Jupyter Notebook
To parse CSV data and build some visualisation we use `Jupyter Notebook`  
Please install `jupyter` using this guide [Jupyter Install](https://docs.jupyter.org/en/latest/install/notebook-classic.html)  
Then run this command `jupyter notebook nft-explorer.ipynb` from `statistics` folder.  
It will open a new tab in your browser where you'll find another Python script in a code block.  
Click `Run` button (with play icon) and wait for the output to appear.

You can change CSV file name on line 5 of this script to check different metrics. 
