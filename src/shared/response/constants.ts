import { HttpStatus } from '@nestjs/common';

export enum HttpStatusCodeDescription {
  SUCCESS = 'Success',
  BAD_REQUEST = 'Bad request',
  INTERNAL_SERVER_ERROR = 'Internal server error',
  NOT_FOUND = 'Not found error',
  CONFLICT = 'Conflict',
  NO_CONTENT = 'No content',
}

export const successMessageResponseSchema = {
  type: 'object',
  example: { statusCode: 'number', message: 'string' },
};

export const getResponseMessageSchema = (
  message: string,
  statusCode?: HttpStatus,
) => ({
  type: 'object',
  example: { statusCode: statusCode?.toString() || 'number', message },
});

export const InternalServerErrorResponseSchema = getResponseMessageSchema(
  'Something went wrong, please try again later',
  HttpStatus.INTERNAL_SERVER_ERROR,
);
