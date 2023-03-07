import { ethers } from 'ethers';
import { ERC_1155_INTERFACE_ID, ERC_721_INTERFACE_ID } from './constants';
import abiNFT from './abi.json';

/**
 * Get an instance of a contract using the address of the contract
 *
 * @example <caption>Get contract instance using contract address and custom provider</caption>
 * getContractInstance('0x76be3b6287...', customProvider);
 *
 * @param {string} contractAddress contract address
 * @param {ethers.providers.BaseProvider} provider provider to access the blockchain data
 * @returns {ethers.Contract} contract instance
 */
export function getContractInstance(contractAddress: string, provider: ethers.providers.BaseProvider): ethers.Contract {
  return new ethers.Contract(contractAddress, abiNFT, provider);
}

/**
 * Asynchronously check if a contract supports ERC721
 *
 * @example <caption>Check ERC721 contract</caption>
 * // Returns true
 * await doesContractSupportERC721(someContract);
 *
 * @example <caption>Check not ERC721 contract</caption>
 * // Returns false
 * await doesContractSupportERC721(someOtherContract);
 *
 * @param {ehters.Contract} contract contract instance
 * @returns {Promise<boolean>} result of checking
 */
export async function doesContractSupportERC721(contract: ethers.Contract): Promise<boolean> {
  try {
    return await contract.supportsInterface(ERC_721_INTERFACE_ID);
  } catch {
    return false;
  }
}

/**
 * Asynchronously check if a contract supports ERC1155
 *
 * @example <caption>Check ERC1155 contract</caption>
 * // Returns true
 * await doesContractSupportERC1155(someContract);
 *
 * @example <caption>Check not ERC1155 contract</caption>
 * // Returns false
 * await doesContractSupportERC1155(someOtherContract);
 *
 * @param {ehters.Contract} contract contract instance
 * @returns {Promise<boolean>} result of checking
 */
export async function doesContractSupportERC1155(contract: ethers.Contract): Promise<boolean> {
  try {
    return await contract.supportsInterface(ERC_1155_INTERFACE_ID);
  } catch {
    return false;
  }
}
