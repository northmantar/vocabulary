import { IsArray } from 'class-validator';
import { PageMetaDto } from './page-meta.dto';
import { ApiProperty } from '@nestjs/swagger';

export class PageDto<T, M = PageMetaDto> {
  @IsArray()
  readonly data: T[];
  @ApiProperty({
    description: '메타데이터',
    type: PageMetaDto,
  })
  readonly meta: M;

  constructor(data: T[], meta: M) {
    this.data = data;
    this.meta = meta;
  }
}
