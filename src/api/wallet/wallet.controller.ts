import { MetadataService } from '@api/metadata';
import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { HttpStatusCodeDescription } from '@shared/response';
import { InternalServerException } from '@shared/response-exception';
import { WalletParamDto, WalletQueryDto } from './dto';
import { WalletService } from './wallet.service';

type NFTData = {
  tokenId: string;
  contract: string;
  description?: string;
  external_url?: string;
  name?: string;
  attributes?: Record<string, unknown>[];
  content?: Record<string, string>[];
  [key: string]: string | number | Record<string, unknown>[] | undefined;
};

/**
 * Wallet controller
 */
@ApiTags('Wallet')
@Controller('/api/v0/:chainName/wallet')
export class WalletController {
  /**
   * WalletController constructor
   * @param {WalletService}
   * @param {MetadataService}
   */
  constructor(
    private walletService: WalletService,
    private metadataService: MetadataService,
  ) {}

  /**
   * Implements API endpoint to retrieve NFTs for wallet address
   * @param {WalletParamDto} data transfer object to validate input params
   * @param {WalletQueryDto} data transfer object to validate input query params
   */
  @Get('/:address/nfts')
  @ApiOkResponse({ description: HttpStatusCodeDescription.SUCCESS })
  @ApiInternalServerErrorResponse({
    description: HttpStatusCodeDescription.INTERNAL_SERVER_ERROR,
    type: InternalServerException,
  })
  @ApiOperation({ summary: 'Returns NFTs for wallet address' })
  public async getNTFs(
    @Param() paramDto: WalletParamDto,
    @Query() queryDto: WalletQueryDto,
  ): Promise<NFTData[]> {
    const { chainName, address } = paramDto;
    const { limit, page, contractAddress } = queryDto;

    const ids = await this.walletService.getNFTs(
      chainName,
      address,
      page,
      limit,
      contractAddress,
    );
    const rawResults = await this.metadataService.getWhereIdIn(ids || []);
    const arrayOfResult: NFTData[] = [];

    for (const id of ids) {
      const dbResult = rawResults.find((res) => res._id === id);
      const [ , contractAddress, tokenId ] = id.split(':');

      let result = { tokenId, contract: contractAddress };

      if (dbResult) {
        const metadata = this.metadataService.checkNftMetadataFormat(dbResult);
        result = { ...result, ...metadata };
      }

      arrayOfResult.push(result);
    }

    return arrayOfResult;
  }
}
