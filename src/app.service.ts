import { Injectable } from '@nestjs/common';
import { Readable } from 'stream';
import csvParser from 'csv-parser';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vocabulary } from 'entities/vocabulary.entity';
import { Grammar } from 'entities/grammar.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Vocabulary)
    private readonly vocabularyRepository: Repository<Vocabulary>,
    @InjectRepository(Grammar)
    private readonly grammarRepository: Repository<Grammar>,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async saveVocabularyFile(file: Express.Multer.File) {
    const results: any[] = [];
    const bufferStream = new Readable();
    bufferStream.push(file.buffer);
    bufferStream.push(null);

    bufferStream
      .pipe(csvParser({ headers: ['kanji', 'furigana', 'meaning'], skipLines: 1 }))
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        for (const result of results) {
          const vocabulary = this.vocabularyRepository.create({
            kanji: result.kanji,
            furigana: result.furigana,
            meaning: result.meaning,
          });
          await this.vocabularyRepository.save(vocabulary);
        }
      });

    return { success: true };
  }

  async saveGrammarFile(file: Express.Multer.File) {
    const results: any[] = [];
    const bufferStream = new Readable();
    bufferStream.push(file.buffer);
    bufferStream.push(null);

    bufferStream
      .pipe(csvParser({ headers: ['grammar', 'meaning', 'memo'], skipLines: 1 }))
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        for (const result of results) {
          const grammar = this.grammarRepository.create({
            grammar: result.grammar,
            meaning: result.meaning,
            memo: result.memo,
          });
          await this.grammarRepository.save(grammar);
        }
      });

    return { success: true };
  }
}
