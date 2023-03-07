import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class ConflictException{
  @ApiProperty({ enum: HttpStatus, default: HttpStatus.CONFLICT })
    statusCode = HttpStatus;

  @ApiProperty()
    message!: string;
}
