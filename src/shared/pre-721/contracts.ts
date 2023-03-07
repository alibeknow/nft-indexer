import {
  ERC_1155_TRANSFER_BATCH_SIG,
  ERC_1155_TRANSFER_SINGLE_SIG,
  ERC_721_TRANSFER_SIG,
  PRE_ERC_721_ERC_20_SIG,
  PRE_ERC_721_WITHOUT_INDEXED_SIG,
} from '@shared/contracts';
import { ContractObject } from './types';

export const CONTRACT_OBJECTS: ContractObject[] = [
  {
    // Autoglyphs
    address: '0xd4e4078ca3495DE5B1d4dB434BEbc5a986197782',
    abi: [ ERC_721_TRANSFER_SIG ],
  },
  {
    // Axie
    address: '0xF5b0A3eFB8e8E4c201e2A935F110eAaF3FFEcb8d',
    abi: [ PRE_ERC_721_ERC_20_SIG ],
  },
  {
    // Cryptocards
    address: '0x3A7DC718Eaf31f0a55988161f3d75D7CA785b034',
    abi: [ ERC_1155_TRANSFER_SINGLE_SIG, ERC_1155_TRANSFER_BATCH_SIG ],
  },
  {
    // Curio-cards
    address: '0x73DA73EF3a6982109c4d5BDb0dB9dd3E3783f313',
    abi: [ ERC_1155_TRANSFER_SINGLE_SIG, ERC_1155_TRANSFER_BATCH_SIG ],
    name: 'Curio-cards',
  },
  {
    // Decentraland
    address: '0xF87E31492Faf9A91B02Ee0dEAAd50d51d56D5d4d',
    abi: [ ERC_721_TRANSFER_SIG ],
    features: {
      api: 'https://api.decentraland.org/v2/contracts/0xf87e31492faf9a91b02ee0deaad50d51d56d5d4d/tokens/',
    },
  },
  {
    // ENS
    address: '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85',
    abi: [ ERC_721_TRANSFER_SIG ],
    name: 'ENS',
    features: {
      api: 'https://metadata.ens.domains/mainnet/0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85/',
    },
  },
  {
    // Etherbots
    address: '0xD2f81Cd7A20d60c0d558496c7169A20968389b40',
    abi: [ PRE_ERC_721_WITHOUT_INDEXED_SIG ],
    features: {
      tokenMetadata: true,
    },
  },
  {
    // Ethermon
    address: '0x5D00d312e171Be5342067c09BaE883f9Bcb2003B',
    abi: [ ERC_721_TRANSFER_SIG ],
    features: {
      api: 'https://ethermon.io/api/monster/get_metadata/v2?monster_ids=',
    },
  },
  {
    // CryptoKitties
    address: '0x06012c8cf97BEaD5deAe237070F9587f8E7A266d',
    abi: [ PRE_ERC_721_WITHOUT_INDEXED_SIG ],
    features: {
      api: 'https://api.cryptokitties.co/kitties/',
    },
  },
  {
    // PepeDapp
    address: '0xdAAe81C0077e8917a2Eb63BB66EF701ff4781Bb0',
    abi: [ ERC_1155_TRANSFER_SINGLE_SIG, ERC_1155_TRANSFER_BATCH_SIG ],
    name: 'PepeDapp',
  },
  {
    // EtherLambos
    address: '0xda9f43015749056182352e9dC6D3eE0B6293D80A',
    abi: [ PRE_ERC_721_WITHOUT_INDEXED_SIG ],
    features: {
      api: 'https://www.etherlambos.io/API/lambo/id/',
    },
  },
];
