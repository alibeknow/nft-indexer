import {
  Controller,
  Get,
  HttpException,
  NotFoundException,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
  Version,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { toChecksumAddress } from '@shared/address';
import { ContractsRepo } from '@shared/contracts';
import {
  HttpStatusCodeDescription,
  InternalServerError,
  InternalServerErrorResponseSchema,
} from '@shared/response';
import {
  BadRequestException,
  InternalServerException,
  NotFoundEx,
} from '@shared/response-exception';
import { NoContentException } from '@shared/response-exception/no-content-exception';
import { TokensRepo } from '@shared/tokens';
import { CollectionResponseDataV1 } from '../collection/collection.controller';
import { NFTsMetadataParamDto, NFTsMetadataQueryDto } from './dto';
import {
  NFTMetadataParamDto,
  TokenConvertedPipe,
} from './dto/nft-metadata-param.dto';
import { MetadataService, NftError, StaxMetadata } from './metadata.service';

class MetadataResponseItemV0 {
  @ApiProperty()
    name!: string;

  @ApiProperty()
    description!: string;

  @ApiProperty()
    attributes!: Record<string, unknown>[];

  @ApiProperty()
    content!: Record<string, string>[];

  @ApiProperty()
    ledger_metadata!: StaxMetadata | undefined;

  [key: string]:
    | string
    | number
    | Record<string, unknown>[]
    | StaxMetadata
    | undefined
}

class Metadata {
  @ApiProperty()
    name!: string;

  @ApiProperty()
    description!: string;

  @ApiProperty()
    image!: string;

  @ApiProperty()
    attributes!: Record<string, unknown>[];

  @ApiProperty()
    ledger_metadata: StaxMetadata | undefined;
}

class MetadataResponseItemV1 {
  @ApiProperty()
    chain!: string;

  @ApiProperty()
    tokenId!: string;

  @ApiProperty()
    tokenType!: string;

  @ApiProperty()
    tokenURI!: string;

  @ApiProperty()
    metadata!: Metadata;

  @ApiProperty()
    contractMetadata!: CollectionResponseDataV1;

  [key: string]:
    | string
    | number
    | Record<string, unknown>[]
    | StaxMetadata
    | CollectionResponseDataV1
    | Metadata
    | undefined
}

/**
 * Metadata Controller V0
 */
@ApiTags('Metadata')
@Controller('/api/v0/:chainName/metadata')
export class MetadataControllerV0 {
  constructor(private metadataService: MetadataService) {}

  /**
   * Implements API endpoint to retrieve metadata for single token
   * @param {NFTMetadataParamDto} data transfer object to validate input params
   */
  @Version('0')
  @Get('/:contractAddress/:tokenId')
  @ApiBadRequestResponse({
    description: HttpStatusCodeDescription.BAD_REQUEST,
    type: BadRequestException,
  })
  @ApiOkResponse({
    description: HttpStatusCodeDescription.SUCCESS,
    type: MetadataResponseItemV0,
  })
  @ApiInternalServerErrorResponse({
    description: HttpStatusCodeDescription.INTERNAL_SERVER_ERROR,
    type: InternalServerException,
  })
  @ApiNotFoundResponse({
    description: HttpStatusCodeDescription.NOT_FOUND,
    type: NotFoundEx,
  })
  @ApiOperation({
    summary:
      'Search a single NFT Metadata by chainName, contractAddress and tokenId',
  })
  @UsePipes(new ValidationPipe(), new TokenConvertedPipe())
  public async getNFTMetadata(
    @Param() paramDto: NFTMetadataParamDto,
  ): Promise<MetadataResponseItemV0 | NftError> {
    const { chainName, contractAddress, tokenId } = paramDto;

    const id = `${chainName}:${toChecksumAddress(contractAddress)}:${tokenId}`;
    const result = await this.metadataService.getWhereIdIn([ id ]);

    if (!result.length) {
      throw new NotFoundException();
    }
    const resultItem = result[0];
    const validatedResult =
      this.metadataService.checkNftMetadataFormat(resultItem);

    const staxResult = await this.metadataService.getStaxMetadata(
      resultItem._id,
    );

    return { ...validatedResult, ledger_metadata: staxResult };
  }

  /**
   * Implements API endpoint to retrieve multiple metadata items for multiple tokens
   * @param {NFTsMetadataParamDto} data transfer object to validate input params
   * @param {NFTsMetadataQueryDto} data transfer object to validate input query params
   */
  @Version('0')
  @Get('/:contractAddress')
  @ApiQuery({
    name: 'tokenIds',
    style: 'form',
    type: 'string',
    required: true,
    isArray: false,
    explode: false,
  })
  @ApiBadRequestResponse({
    description: HttpStatusCodeDescription.BAD_REQUEST,
    type: BadRequestException,
  })
  @ApiOkResponse({
    description: HttpStatusCodeDescription.SUCCESS,
    type: MetadataResponseItemV0,
  })
  @ApiInternalServerErrorResponse({
    description: HttpStatusCodeDescription.INTERNAL_SERVER_ERROR,
    type: InternalServerException,
  })
  @ApiOperation({
    summary:
      'Search multiple NFTs Metadata by chainName, contractAddress and tokenIds query param',
  })
  public async getNFTsMetadata(
    @Param() paramDto: NFTsMetadataParamDto,
    @Query() queryDto: NFTsMetadataQueryDto,
  ): Promise<(MetadataResponseItemV0 | NftError)[]> {
    const { chainName, contractAddress } = paramDto;
    const { tokenIds } = queryDto;

    const ids = tokenIds?.map(
      (tokenId) =>
        `${chainName}:${toChecksumAddress(contractAddress)}:${tokenId}`,
    );
    const rawResults = await this.metadataService.getWhereIdIn(ids || []);
    const arrayOfResult = [];

    for (const metadata of rawResults) {
      const result = this.metadataService.checkNftMetadataFormat(metadata);
      const staxResult = await this.metadataService.getStaxMetadata(
        metadata._id,
      );
      arrayOfResult.push({ ...result, ledger_metadata: staxResult });
    }

    return arrayOfResult;
  }
}

/**
 * Metadata Controller V1
 */
@ApiTags('Metadata')
@Controller('/api/v1/:chainName/metadata')
export class MetadataControllerV1 {
  constructor(
    private readonly tokensRepo: TokensRepo,
    private readonly contractsRepo: ContractsRepo,
    private metadataService: MetadataService,
  ) {}

  /**
   * Implements API endpoint to retrieve metadata for single token
   * @param {NFTMetadataParamDto} data transfer object to validate input params
   */
  @Version('1')
  @Get('/:contractAddress/:tokenId')
  @ApiBadRequestResponse({
    type: BadRequestException,
    description: 'Invalid contract address OR Invalid tokenID',
  })
  @ApiOkResponse({
    description: HttpStatusCodeDescription.SUCCESS,
    type: MetadataResponseItemV1,
  })
  @ApiInternalServerErrorResponse({
    description: HttpStatusCodeDescription.INTERNAL_SERVER_ERROR,
    schema: InternalServerErrorResponseSchema,
  })
  @ApiNotFoundResponse({
    description: 'Token not found',
    type: NotFoundEx,
  })
  @ApiNoContentResponse({
    description: HttpStatusCodeDescription.NO_CONTENT,
    type: NoContentException,
  })
  @ApiOperation({
    summary:
      'Search a single NFT Metadata by chainName, contractAddress and tokenId',
  })
  @UsePipes(new ValidationPipe(), new TokenConvertedPipe())
  public async getNFTMetadata(
    @Param() paramDto: NFTMetadataParamDto,
  ): Promise<MetadataResponseItemV1> {
    const { chainName, contractAddress, tokenId } = paramDto;

    try {
      const normalizedContractAddress = toChecksumAddress(contractAddress);

      const contract = await this.contractsRepo.get(
        `${chainName}:${normalizedContractAddress}`,
      );

      if (!contract) {
        throw new NotFoundException(
          `Contract address '${contractAddress}' not found`,
        );
      }

      const tokenDbId = `${chainName}:${normalizedContractAddress}:${tokenId}`;
      const token = await this.tokensRepo.getById(tokenDbId);

      if (!token) {
        throw new NotFoundException(`Token '${tokenDbId}' not found`);
      }

      if (token.tokenUri === '') {
        throw new HttpException(
          'Metadata unavailable as the tokenURI is empty',
          204,
        );
      }

      if (!token.tokenUri) {
        throw new HttpException(
          'Metadata unavailable as the tokenURI method is missing from the smart contract',
          204,
        );
      }

      const result = await this.metadataService.getWhereIdIn([ tokenDbId ]);

      if (!result.length) {
        throw new HttpException(
          'Metadata unavailable as the tokenURI is unable to respond.',
          204,
        );
      }

      const metadata = result[0];
      const validatedResult =
        this.metadataService.checkNftMetadataFormat(metadata);

      const staxResult = await this.metadataService.getStaxMetadata(
        metadata._id,
      );

      return {
        tokenId,
        chain: chainName,
        tokenType: contract.type,
        metadata: {
          name: validatedResult.name,
          description: validatedResult.description,
          attributes: validatedResult.attributes,
          image: validatedResult.image,
          ledger_metadata: staxResult,
        },
        tokenURI: token.tokenUri,
        contractMetadata: {
          address: contract.address,
          name: contract.name,
          tokenType: contract.type,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerError();
    }
  }
}
