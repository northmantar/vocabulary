import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateGrammarDto {
  @IsString()
  @IsNotEmpty()
  grammar: string;

  @IsString()
  @IsOptional()
  furigana?: string;

  @IsString()
  @IsNotEmpty()
  meaning: string;

  @IsString()
  @IsOptional()
  memo?: string;
}
