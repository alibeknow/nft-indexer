import { HttpException, HttpStatus } from '@nestjs/common';
import web3 from 'web3';

export const toValidHex = (tokenId: string): string => {
  if (web3.utils.isHexStrict(tokenId)) {
    return tokenId;
  }

  try {
    const number = web3.utils.toBN(tokenId);

    return web3.utils.toHex(number);
  } catch (error) {
    throw new HttpException(
      `Please make sure that '${tokenId}' is a valid hex or decimal tokenID`,
      HttpStatus.BAD_REQUEST,
    );
  }
};
