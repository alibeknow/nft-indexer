import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiExtraModels,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  HttpStatusCodeDescription,
  InternalServerError,
  InternalServerErrorResponseSchema,
  getResponseMessageSchema,
} from '@shared/response';
import { RefreshContractRequest, RefreshTokenRequest } from './dto';
import { RefreshService } from './refresh.service';

@ApiTags('Refresh')
@Controller('/api/v0/refresh')
export class RefreshController {
  constructor(private readonly refreshService: RefreshService) {}

  @Post('/contract')
  @HttpCode(200)
  @ApiExtraModels(RefreshContractRequest)
  @ApiOkResponse({
    schema: getResponseMessageSchema(
      'The metadata sync has been initiated for contract address {contractAddress}',
    ),
    description: HttpStatusCodeDescription.SUCCESS,
  })
  @ApiNotFoundResponse({
    description: 'Contract not found',
    schema: getResponseMessageSchema(
      'Contract address \'{contractAddress}\' was not found',
    ),
  })
  @ApiBadRequestResponse({
    description: 'Invalid contract address',
    schema: getResponseMessageSchema(
      'Please make sure that \'{contractAddress}\' is a valid hex contract address',
    ),
  })
  @ApiInternalServerErrorResponse({
    description: HttpStatusCodeDescription.INTERNAL_SERVER_ERROR,
    schema: InternalServerErrorResponseSchema,
  })
  @ApiOperation({
    summary:
      'Refresh the contract name and metadata of all tokens pertaining to contractAddress on the chain',
  })
  public async refreshContract(
    @Body(new ValidationPipe({ whitelist: true })) body: RefreshContractRequest,
  ): Promise<string> {
    try {
      await this.refreshService.refreshContract(body);

      return `The metadata sync has been initiated for contract address ${body.contractAddress}`;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerError();
    }
  }

  @Post('/token')
  @HttpCode(200)
  @ApiExtraModels(RefreshTokenRequest)
  @ApiOkResponse({
    schema: {
      type: 'object',
      example: {
        statusCode: '200',
        response: 'The metadata sync has been initiated',
      },
    },
    description: HttpStatusCodeDescription.SUCCESS,
  })
  @ApiNotFoundResponse({
    description: 'Token not found',
    schema: {
      anyOf: [
        getResponseMessageSchema(
          'Token \'{contractAddress}:{tokenId}\' not found',
        ),
        getResponseMessageSchema('Couldn\'t fetch the tokenURI'),
      ],
    },
  })
  @ApiBadRequestResponse({
    schema: {
      anyOf: [
        getResponseMessageSchema(
          'Please make sure that \'{contractAddress}\' is a valid hex contract address',
        ),
        getResponseMessageSchema(
          'Please make sure that \'{tokenId}\' is a valid hex or decimal tokenID',
        ),
      ],
    },
    description: 'Invalid contract address OR Invalid tokenID',
  })
  @ApiInternalServerErrorResponse({
    description: HttpStatusCodeDescription.INTERNAL_SERVER_ERROR,
    schema: InternalServerErrorResponseSchema,
  })
  @ApiOperation({
    summary: 'Force refresh token by chain name, contract address and token id',
  })
  public async refreshToken(
    @Body(new ValidationPipe({ whitelist: true })) body: RefreshTokenRequest,
  ): Promise<string> {
    try {
      await this.refreshService.refreshToken(body);

      return 'The metadata sync has been initiated';
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerError();
    }
  }
}
