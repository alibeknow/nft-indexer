import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class NotFoundEx{
  @ApiProperty({ enum: HttpStatus, default: HttpStatus.NOT_FOUND })
    statusCode = HttpStatus;

  @ApiProperty()
    message!: string;
}
