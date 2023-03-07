import { IsBoolean, IsInt, IsPositive } from 'class-validator';

export class IndexerDto {

  @IsPositive()
  @IsInt()
  public readonly blockFrom!: number;

  @IsPositive()
  @IsInt()
  public readonly blockTo!: number;

  @IsBoolean()
  public readonly reread!: boolean;
}
