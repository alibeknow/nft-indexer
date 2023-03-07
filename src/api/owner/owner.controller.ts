import { NFTMetadataParamDto, TokenConvertedPipe } from '@api/metadata/dto';
import { OwnerService } from '@api/owner/owner.service';
import {
  Controller,
  Get,
  Param,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiExcludeEndpoint,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { HttpStatusCodeDescription } from '@shared/response';
import { InternalServerException, NotFoundEx } from '@shared/response-exception';

/**
 * Owner Controller
 */
@ApiTags('Owners')
@Controller('/api/v0/:chainName/owners')
export class OwnerController {
  constructor(private ownerService: OwnerService) {}

  /**
   * Implements API endpoint to retrieve owners for single token
   * @param {NFTMetadataParamDto} data transfer object to validate input params
   */
  @Get('/:contractAddress/:tokenId')
  @ApiExcludeEndpoint()
  @ApiOkResponse({ description: HttpStatusCodeDescription.SUCCESS })
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
      'Returns owners for a single NFT by chainName, contractAddress and tokenId',
  })
  @UsePipes(new ValidationPipe(), new TokenConvertedPipe())
  public async getNFTOwners(@Param() paramDto: NFTMetadataParamDto) {
    const { chainName, contractAddress, tokenId } = paramDto;

    return this.ownerService.getOwners(chainName, contractAddress, tokenId);
  }
}
