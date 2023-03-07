import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiExtraModels, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchByAddressParamDto, SearchQueryDto } from './dto';
import { HttpStatusCodeDescription } from '@shared/response';
import { InternalServerException, NotFoundEx } from '@shared/response-exception';
import { IOpensearchSearchParams } from '@shared/opensearch';
import { SearchQueryWithAddressDto } from './dto/search-contract-query.dto';

class MetadataSearchResponseItem {
  @ApiProperty()
    token_id!: string;

  @ApiProperty()
    token_address!: string;

  @ApiProperty()
    token_uri!: string | null;

  @ApiProperty()
    metadata!: string;

  @ApiProperty()
    contract_type!: string;

  @ApiProperty()
    token_hash?: string | null;

  @ApiProperty()
    synced_at?: Date | null;

  @ApiProperty()
    created_at?: Date | null;
}

class MetadataSearchResponse {
  @ApiProperty()
    from!: number;

  @ApiProperty()
    size!: number;

  @ApiProperty()
    total!: number;

  @ApiProperty({
    name: 'hits',
    type: [ MetadataSearchResponseItem ],
    isArray: true,
  })
  public hits!: MetadataSearchResponseItem[];
}

class ContractSearchResponseItem {
  @ApiProperty()
    contract_address!: string;

  @ApiProperty()
    contract_name!: string;

  @ApiProperty()
    contract_description!: string;

  @ApiProperty()
    verified!: boolean;

  @ApiProperty()
    number_of_tokens!: number;

  @ApiProperty()
    contract_type!: string;

  @ApiProperty()
    synced_at?: Date | null;

  @ApiProperty()
    created_at?: Date | null;

  @ApiProperty()
    collection_image?: string;
}

class ContractsSearchResponse {
  @ApiProperty()
    from!: number;

  @ApiProperty()
    size!: number;

  @ApiProperty()
    total!: number;

  @ApiProperty({
    name: 'hits',
    type: [ ContractSearchResponseItem ],
    isArray: true,
  })
  public hits!: ContractSearchResponseItem[];
}

/**
 * Search Controller
 */
@ApiTags('Search')
@Controller('/api/v0/search')
export class SearchController {

  constructor(private readonly searchService: SearchService) {}

  @Get('/metadata')
  @ApiExtraModels(SearchQueryWithAddressDto)
  @ApiBadRequestResponse({ description: HttpStatusCodeDescription.BAD_REQUEST })
  @ApiOkResponse({ description: HttpStatusCodeDescription.SUCCESS, type: MetadataSearchResponse })
  @ApiInternalServerErrorResponse({ description: HttpStatusCodeDescription.INTERNAL_SERVER_ERROR, type: InternalServerException })
  @ApiNotFoundResponse({ description: HttpStatusCodeDescription.NOT_FOUND, type: NotFoundEx })
  @ApiOperation({ summary: 'Search a NFT Metadata' })
  public async getMetadataSearch(@Query() searchAttributes: SearchQueryWithAddressDto): Promise<MetadataSearchResponse>{
    const params: IOpensearchSearchParams = {
      q: searchAttributes.q,
      filter: searchAttributes.filter,
      contractAddress: searchAttributes.contractAddress,
      chain: searchAttributes.chain,
      from: searchAttributes.from,
      size: searchAttributes.size,
    };

    const results = await this.searchService.getMetadataSearch(params);

    return results;
  }

  @Get('/contracts')
  @ApiExtraModels(SearchQueryDto)
  @ApiBadRequestResponse({ description: HttpStatusCodeDescription.BAD_REQUEST })
  @ApiOkResponse({ description: HttpStatusCodeDescription.SUCCESS, type: ContractsSearchResponse })
  @ApiInternalServerErrorResponse({ description: HttpStatusCodeDescription.INTERNAL_SERVER_ERROR, type: InternalServerException })
  @ApiNotFoundResponse({ description: HttpStatusCodeDescription.NOT_FOUND, type: NotFoundEx })
  @ApiOperation({ summary: 'Search contracts by name' })
  public async getContractsSearch(@Query() searchAttributes: SearchQueryDto): Promise<ContractsSearchResponse> {
    const params: IOpensearchSearchParams = {
      q: searchAttributes.q,
      filter: searchAttributes.filter,
      chain: searchAttributes.chain,
      from: searchAttributes.from,
      size: searchAttributes.size,
    };

    const results = await this.searchService.getContractsSearch(params);

    return results;
  }

  @Get('/contracts/:address')
  @ApiExtraModels(SearchByAddressParamDto)
  @ApiBadRequestResponse({ description: HttpStatusCodeDescription.BAD_REQUEST })
  @ApiOkResponse({ description: HttpStatusCodeDescription.SUCCESS, type: ContractsSearchResponse })
  @ApiInternalServerErrorResponse({ description: HttpStatusCodeDescription.INTERNAL_SERVER_ERROR, type: InternalServerException })
  @ApiNotFoundResponse({ description: HttpStatusCodeDescription.NOT_FOUND, type: NotFoundEx })
  @ApiOperation({ summary: 'Search contracts by address' })
  public async getContractsByAddress(@Param() params: SearchByAddressParamDto): Promise<ContractsSearchResponse> {
    const results = await this.searchService.getContractsByAddress(params.address);

    return results;
  }
}
