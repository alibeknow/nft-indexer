import { HttpException, HttpStatus } from '@nestjs/common';

export class InternalServerError extends HttpException {
  constructor() {
    super(
      'Something went wrong, please try again later',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
