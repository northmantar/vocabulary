import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PageOptionsDto {
  @ApiProperty({ description: '페이지 번호', required: false })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  pageNumber: number = 1;

  @ApiProperty({ description: '페이지 크기', required: false })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  pageSize: number = 10;

  get skip(): number {
    return this.pageNumber <= 0 ? 0 : (this.pageNumber - 1) * this.pageSize;
  }
}