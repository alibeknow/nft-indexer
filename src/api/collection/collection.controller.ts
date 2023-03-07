import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  ValidationPipe,
  Version,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiExtraModels,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { toChecksumAddress } from '@shared/address';
import {
  HttpStatusCodeDescription,
  InternalServerError,
  InternalServerErrorResponseSchema,
  getResponseMessageSchema,
} from '@shared/response';
import { InternalServerException, NotFoundEx } from '@shared/response-exception';
import { TokenStandard } from '@shared/tokens';
import { CollectionService } from './collection.service';
import { CollectionParamDto } from './dto/collection-param.dto';
import { ConfigService } from '@nestjs/config';
import { IApiConfig } from '@api/app.config';
import { IOpenseaConfig, OpenseaClient } from '@shared/opensea';
import { logger } from '@shared/logger';

class CollectionResponseDataV0 {
  @ApiProperty()
    id!: string;

  @ApiProperty({ type: 'string' })
    name?: string | null;

  @ApiProperty({ enum: TokenStandard })
    type?: TokenStandard;
}

/**
 * Collection controller V0
 */
@ApiTags('Collection')
@Controller('/api/v0/:chainName/contracts')
export class CollectionControllerV0 {
  constructor(private readonly collectionService: CollectionService) {}

  /**
   * Implements API endpoint to retrieve a single contract data
   */
  @Version('0')
  @Get('/:contractId')
  @HttpCode(200)
  @ApiExtraModels(CollectionParamDto)
  @ApiOkResponse({
    description: HttpStatusCodeDescription.SUCCESS,
    type: CollectionResponseDataV0,
  })
  @ApiNotFoundResponse({
    description: HttpStatusCodeDescription.NOT_FOUND,
    type: NotFoundEx,
  })
  @ApiBadRequestResponse({
    description: HttpStatusCodeDescription.BAD_REQUEST,
    type: BadRequestException,
  })
  @ApiInternalServerErrorResponse({
    description: HttpStatusCodeDescription.INTERNAL_SERVER_ERROR,
    type: InternalServerException,
  })
  @ApiOperation({ summary: 'Get collection by chainName and contractId' })
  public async getCollection(
    @Param(new ValidationPipe({ whitelist: true })) params: CollectionParamDto,
  ): Promise<CollectionResponseDataV0> {
    const id = `${params.chainName}:${toChecksumAddress(params.contractId)}`;
    const collection = await this.collectionService.get(id);

    if (!collection) {
      throw new NotFoundException();
    }

    return {
      id: collection._id,
      name: collection?.name,
      type: collection?.type,
    };
  }
}

export class CollectionResponseDataV1 {
  @ApiProperty({ type: 'string' })
    address?: string | null;

  @ApiProperty({ type: 'string' })
    name?: string | null;

  @ApiProperty({ enum: TokenStandard })
    tokenType?: TokenStandard;
}

class CollectionResponseDataV2 {
  @ApiProperty({ type: 'string' })
    contractAddress?: string | null;

  @ApiProperty({ type: 'string' })
    name?: string | null;

  @ApiProperty({ enum: TokenStandard })
    tokenType?: TokenStandard;

  @ApiProperty({ type: 'string' })
    collectionImage?: string | null;
}

/**
 * Collection controller V1
 */
@ApiTags('Collection')
@Controller('/api/v1/:chainName/contracts')
export class CollectionControllerV1 {
  constructor(private readonly collectionService: CollectionService) {}

  /**
   * Implements API endpoint to retrieve a single contract data
   */
  @Version('1')
  @Get('/:contractId')
  @HttpCode(200)
  @ApiExtraModels(CollectionParamDto)
  @ApiOkResponse({
    description: HttpStatusCodeDescription.SUCCESS,
    type: CollectionResponseDataV1,
  })
  @ApiNotFoundResponse({
    description: 'Metadata not found',
    schema: getResponseMessageSchema(
      'No metadata found for the contract address {contract_address}',
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
      'Returns high-level contract metadata for a given contract address',
  })
  public async getCollection(
    @Param(new ValidationPipe({ whitelist: true })) params: CollectionParamDto,
  ): Promise<CollectionResponseDataV1> {
    try {
      const id = `${params.chainName}:${toChecksumAddress(params.contractId)}`;
      const contract = await this.collectionService.get(id);

      if (!contract) {
        throw new HttpException(
          `No metadata found for the contract address ${params.contractId}`,
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        address: contract?.address,
        name: contract?.name,
        tokenType: contract?.type,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerError();
    }
  }
}

/**
 * Collection controller V2
 */
@ApiTags('Collection')
@Controller('/api/v2/:chainName/contracts')
export class CollectionControllerV2 {
  private readonly openseaClient: OpenseaClient;
  constructor(
      private readonly collectionService: CollectionService,
      private readonly configService: ConfigService<IApiConfig>,
  ) {
    const openseaConfig = this.configService.get<IOpenseaConfig>('opensea') as IOpenseaConfig;
    this.openseaClient = new OpenseaClient(openseaConfig);
  }

  /**
   * Implements API endpoint to retrieve a single contract data
   */
  @Version('2')
  @Get('/:contractId')
  @HttpCode(200)
  @ApiExtraModels(CollectionParamDto)
  @ApiOkResponse({
    description: HttpStatusCodeDescription.SUCCESS,
    type: CollectionResponseDataV2,
  })
  @ApiNotFoundResponse({
    description: 'Metadata not found',
    schema: getResponseMessageSchema(
      'No metadata found for the contract address {contract_address}',
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
      'Returns high-level contract metadata for a given contract address',
  })
  public async getCollection(
    @Param(new ValidationPipe({ whitelist: true })) params: CollectionParamDto,
  ): Promise<CollectionResponseDataV2> {
    try {
      const id = `${params.chainName}:${toChecksumAddress(params.contractId)}`;
      const contract = await this.collectionService.get(id);

      if (!contract) {
        throw new HttpException(
          `No metadata found for the contract address ${params.contractId}`,
          HttpStatus.NOT_FOUND,
        );
      }

      let imageUrl = contract.collectionImage?.url || '';

      if (!imageUrl) {
        try {
          imageUrl = await this.openseaClient.getOpenseaCollectionImageUrl(contract.address);
        } catch (e) {
          logger.error(`Failed to fetch opensea collection image for contract address: ${contract.address}`);
        }
      }

      return {
        contractAddress: contract?.address,
        name: contract?.name,
        tokenType: contract?.type,
        collectionImage: imageUrl,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerError();
    }
  }
}
