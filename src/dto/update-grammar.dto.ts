import { IsOptional, IsString } from 'class-validator';

export class UpdateGrammarDto {
  @IsString()
  @IsOptional()
  grammar: string;

  @IsString()
  @IsOptional()
  furigana: string;

  @IsString()
  @IsOptional()
  meaning: string;

  @IsString()
  @IsOptional()
  memo: string;
}
