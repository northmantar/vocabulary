import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateVocabularyDto {
  @IsString()
  @IsNotEmpty()
  kanji: string;

  @IsString()
  @IsOptional()
  furigana?: string;

  @IsString()
  @IsNotEmpty()
  meaning: string;
}
