import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class NoContentException {
  @ApiProperty({ enum: HttpStatus, default: HttpStatus.NO_CONTENT })
    statusCode = HttpStatus;

  @ApiProperty()
    message!: string;
}
