import { HttpStatus } from '@nestjs/common/enums';
import { HttpException } from '@nestjs/common/exceptions';
import web3 from 'web3';

export function toChecksumAddress(address: string): string {
  try {
    return web3.utils.toChecksumAddress(address);
  } catch (error) {
    throw new HttpException(
      `Please make sure that '${address}' is a valid hex contract address`,
      HttpStatus.BAD_REQUEST,
    );
  }
}
