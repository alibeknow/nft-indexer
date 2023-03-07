import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class BadRequestException{
  @ApiProperty({ enum: HttpStatus, default: HttpStatus.BAD_REQUEST })
    statusCode = HttpStatus;

  @ApiProperty()
    message!: string;
}
