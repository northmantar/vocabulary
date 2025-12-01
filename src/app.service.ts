import { Injectable, NotFoundException } from '@nestjs/common';
import { Readable } from 'stream';
import * as csvParser from 'csv-parser';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vocabulary } from 'entities/vocabulary.entity';
import { Grammar } from 'entities/grammar.entity';
import { PageOptionsDto } from './page/page-options.dto';
import { PageMetaDto } from './page/page-meta.dto';
import { PageDto } from './page/page.dto';

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

  async getVocabulary(pageOptionsDto: PageOptionsDto, starred: boolean = false) {
    console.log(`> pageOptionsDto: ${JSON.stringify(pageOptionsDto)}`);
    const [vocabularies, total] = await this.vocabularyRepository.findAndCount({
      skip: pageOptionsDto.skip,
      take: pageOptionsDto.pageSize,
      order: { star: 'DESC', id: 'DESC' },
      ...(starred ? { where: { star: true } } : {}),
    });

    const pageMetaDto = new PageMetaDto({ pageOptionsDto, total });
    const lastPage = pageMetaDto.lastPage;

    if (!vocabularies.length || lastPage >= pageMetaDto.pageNumber) {
      return new PageDto<Vocabulary>(vocabularies, pageMetaDto);
    } else {
      throw new NotFoundException('No more data');
    }
  }

  async getVocabularyById(id: number) {
    const vocabulary = await this.vocabularyRepository.findOne({ where: { id } });
    return vocabulary;
  }

  async saveVocabularyFile(file: Express.Multer.File) {
    const results: any[] = [];
    const bufferStream = new Readable();
    bufferStream.push(file.buffer);
    bufferStream.push(null);

    const upserts = [];
    bufferStream
      .pipe(csvParser({ headers: ['kanji', 'furigana', 'meaning'], skipLines: 1 }))
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        for (const result of results) {
          upserts.push({
            kanji: result.kanji,
            furigana: result.furigana,
            meaning: result.meaning,
          });
        }
        await this.vocabularyRepository.upsert(upserts, {
          conflictPaths: ['kanji'],
          skipUpdateIfNoValuesChanged: true,
        });
      });

    return { success: true };
  }

  async getGrammar(pageOptionsDto: PageOptionsDto, starred: boolean = false) {
    const [grammars, total] = await this.grammarRepository.findAndCount({
      skip: pageOptionsDto.skip,
      take: pageOptionsDto.pageSize,
      order: { star: 'DESC', id: 'DESC' },
      ...(starred ? { where: { star: true } } : {}),
    });

    const pageMetaDto = new PageMetaDto({ pageOptionsDto, total });
    const lastPage = pageMetaDto.lastPage;

    if (!grammars.length || lastPage >= pageMetaDto.pageNumber) {
      return new PageDto<Grammar>(grammars, pageMetaDto);
    } else {
      throw new NotFoundException('No more data');
    }
  }

  async getGrammarById(id: number) {
    const grammar = await this.grammarRepository.findOne({ where: { id } });
    return grammar;
  }

  async saveGrammarFile(file: Express.Multer.File) {
    const results: any[] = [];
    const bufferStream = new Readable();
    bufferStream.push(file.buffer);
    bufferStream.push(null);

    const upserts = [];
    bufferStream
      .pipe(csvParser({ headers: ['grammar', 'meaning', 'memo'], skipLines: 1 }))
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        for (const result of results) {
          upserts.push({
            grammar: result.grammar,
            meaning: result.meaning,
            memo: result.memo,
          });
        }
        await this.grammarRepository.upsert(upserts, {
          conflictPaths: ['grammar'],
          skipUpdateIfNoValuesChanged: true,
        });
      });

    return { success: true };
  }

  async starVocabulary(id: number) {
    const vocabulary = await this.vocabularyRepository.findOne({ select: ['id', 'star'], where: { id } });
    vocabulary.star = !vocabulary.star;
    await this.vocabularyRepository.save(vocabulary);
    return { success: true };
  }

  async starGrammar(id: number) {
    const grammar = await this.grammarRepository.findOne({ select: ['id', 'star'], where: { id } });
    grammar.star = !grammar.star;
    await this.grammarRepository.save(grammar);
    return { success: true };
  }
}
