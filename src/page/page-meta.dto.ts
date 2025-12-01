import { ApiProperty } from '@nestjs/swagger';
import { PageOptionsDto } from './page-options.dto';

interface PageMetaDtoParameters {
  pageOptionsDto: PageOptionsDto;
  total: number;
}

export class PageMetaDto {
  @ApiProperty({ description: '총 개수' })
  readonly total: number;
  
  @ApiProperty({ description: '페이지 번호' })
  readonly pageNumber: number;
  
  @ApiProperty({ description: '페이지 크기' })
  readonly pageSize: number;
  
  @ApiProperty({ description: '마지막 페이지' })
  readonly lastPage: number;
  
  @ApiProperty({ description: '이전 페이지 존재 여부' })
  readonly hasPreviousPage: boolean;
  
  @ApiProperty({ description: '다음 페이지 존재 여부' })
  readonly hasNextPage: boolean;

  constructor({ pageOptionsDto, total }: PageMetaDtoParameters) {
    this.pageNumber =
      pageOptionsDto.pageNumber <= 0 ? 1 : pageOptionsDto.pageNumber;
    this.pageSize = pageOptionsDto.pageSize;
    this.total = total;
    this.lastPage = Math.ceil(this.total / this.pageSize);
    this.hasPreviousPage = this.pageNumber > 1;
    this.hasNextPage = this.pageNumber < this.lastPage;
  }
}
