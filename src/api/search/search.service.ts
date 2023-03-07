import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContractsRepo, IContractIndex, IContractSearchResult, mapToSearchContractResult } from '@shared/contracts';
import { IMetadataIndex, IMetadataRepo, IMetadataSearchResult, METADATA_REPO_PROVIDER, Metadata, mapToSearchResult } from '@shared/metadata';
import { IOpenseaConfig, OpenseaClient } from '@shared/opensea';
import { IOpensearchConfig, IOpensearchSearchParams, IOpensearchSearchResult, OpensearchProvider } from '@shared/opensearch';
import { TokensRepo } from '@shared/tokens';
import { IApiConfig } from '../app.config';

@Injectable()
export class SearchService {
  private readonly opensearchMetadataIndexName: string;
  private readonly opensearchContractsIndexName: string;
  private readonly openseaClient: OpenseaClient;

  constructor(
    private readonly configService: ConfigService<IApiConfig>,
    private readonly opensearchProvider: OpensearchProvider<IApiConfig>,
    @Inject(METADATA_REPO_PROVIDER) private readonly metadataRepo: IMetadataRepo,
    private readonly contractsRepo: ContractsRepo,
    private readonly tokensRepo: TokensRepo,
  ) {
    const opensearchConfig = this.configService.get<IOpensearchConfig>('opensearch') as IOpensearchConfig;
    const openseaConfig = this.configService.get<IOpenseaConfig>('opensea') as IOpenseaConfig;

    this.opensearchMetadataIndexName = opensearchConfig.indexNameMetadata;
    this.opensearchContractsIndexName = opensearchConfig.indexNameContracts;
    this.openseaClient = new OpenseaClient(openseaConfig);
  }

  public async getMetadataSearch(params: IOpensearchSearchParams): Promise<IOpensearchSearchResult<IMetadataSearchResult>> {
    params.q = [ params.q, params.contractAddress ].join(' ');
    params.filter = [ ...params.filter, 'contractAddress' ];

    const searchResult: IOpensearchSearchResult<IMetadataIndex> = await this.opensearchProvider.search<IMetadataIndex>(this.opensearchMetadataIndexName, params);
    const metadataIds = searchResult.hits.map((searchResultItem) => searchResultItem.id).filter(item => item !== null) as string[];
    const metadataList = await this.metadataRepo.getWhereIdIn(metadataIds);

    const { tokensIds, contractsIds } = metadataIds.reduce<Record<string, string[]>>((acc, cur) => {
      const [ chain, contractAddress ] = cur.split(':', 3);

      acc.tokensIds.push(cur);

      if (!acc.contractsIds.includes(`${chain}:${contractAddress}`)) {
        acc.contractsIds.push(`${chain}:${contractAddress}`);
      }

      return acc;
    }, {
      tokensIds: [],
      contractsIds: [],
    });

    const [ tokens, contracts ] = await Promise.all([
      this.tokensRepo.getWhereIdIn(tokensIds),
      this.contractsRepo.getWhereIdIn(contractsIds),
    ]);

    const tokensObj = tokens.reduce((acc, curr) => ({
      ...acc,
      [curr._id]: curr,
    }), {});

    const contractsObj = contracts.reduce((acc, curr) => ({
      ...acc,
      [curr._id]: curr,
    }), {});

    const hits = metadataList.map((metadata: Metadata) => mapToSearchResult(metadata, tokensObj, contractsObj)).filter(item => item !== null) as IMetadataSearchResult[];

    return {
      ...searchResult,
      hits,
    };
  }

  public async getContractsSearch(params: IOpensearchSearchParams): Promise<IOpensearchSearchResult<IContractSearchResult>> {
    const searchResult: IOpensearchSearchResult<IContractIndex> = await this.opensearchProvider.search<IContractIndex>(this.opensearchContractsIndexName, params);

    const searchContracts = searchResult.hits.map(mapToSearchContractResult).filter(item => item !== null) as IContractSearchResult[];
    const hits = await Promise.all(searchContracts.map(async (item) => {
      if (item.collection_image) {
        return item;
      }

      const image = await this.openseaClient.getOpenseaCollectionImageUrl(item.contract_address);

      return {
        ...item,
        collection_image: image,
      };
    }));

    return {
      ...searchResult,
      hits,
    };
  }

  public async getContractsByAddress(address: string): Promise<IOpensearchSearchResult<IContractSearchResult>> {
    const params: IOpensearchSearchParams = {
      q: address,
      filter: [ 'address' ],
    };

    return this.getContractsSearch(params);
  }
}
