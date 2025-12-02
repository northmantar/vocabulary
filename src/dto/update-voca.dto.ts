import { IsOptional, IsString } from "class-validator";

export class UpdateVocabularyDto {
  @IsString()
  @IsOptional()
  kanji: string;

  @IsString()
  @IsOptional()
  furigana: string;

  @IsString()
  @IsOptional()
  meaning: string;
}