import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Readable } from 'stream';
import * as csvParser from 'csv-parser';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Vocabulary } from 'entities/vocabulary.entity';
import { Grammar } from 'entities/grammar.entity';
import { PageOptionsDto } from './page/page-options.dto';
import { PageMetaDto } from './page/page-meta.dto';
import { PageDto } from './page/page.dto';
import { UpdateVocabularyDto } from './dto/update-voca.dto';
import { UpdateGrammarDto } from './dto/update-grammar.dto';
import { FindOptionsWhere } from 'typeorm';
import { CreateVocabularyDto } from './dto/create-voca.dto';
import { CreateGrammarDto } from './dto/create-grammar.dto';
import { HonorificType } from 'entities/enum/honorific-type.enum';
import { Honorific } from 'entities/honorific.entity';
import { RiAdverb } from 'entities/ri-adverb.entity';
import { Onomatopoeia } from 'entities/onomatopoeia.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Vocabulary)
    private readonly vocabularyRepository: Repository<Vocabulary>,
    @InjectRepository(Grammar)
    private readonly grammarRepository: Repository<Grammar>,
    @InjectRepository(Honorific)
    private readonly honorificRepository: Repository<Honorific>,
    @InjectRepository(RiAdverb)
    private readonly riAdverbRepository: Repository<RiAdverb>,
    @InjectRepository(Onomatopoeia)
    private readonly onomatopoeiaRepository: Repository<Onomatopoeia>,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getVocabulary(pageOptionsDto: PageOptionsDto, starred: boolean = false, keyword?: string) {
    let where: FindOptionsWhere<Vocabulary> | FindOptionsWhere<Vocabulary>[] | null = null;
    if (keyword) {
      where = [{ kanji: Like(`%${keyword}%`) }, { furigana: Like(`%${keyword}%`) }, { meaning: Like(`%${keyword}%`) }];
    }
    if (starred) {
      if (Array.isArray(where) && where.length) {
        where = where.map((item) => {
          item.star = true;
          return item;
        });
      } else {
        where = { star: true };
      }
    }

    const [vocabularies, total] = await this.vocabularyRepository.findAndCount({
      skip: pageOptionsDto.skip,
      take: pageOptionsDto.pageSize,
      order: { star: 'DESC', id: 'DESC' },
      where,
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

  async createVocabulary(createVocabularyDto: CreateVocabularyDto) {
    const vocabulary = this.vocabularyRepository.create(createVocabularyDto);
    await this.vocabularyRepository.save(vocabulary);
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

  async updateVocabulary(id: number, updateVocabularyDto: UpdateVocabularyDto) {
    try {
      const vocabulary = await this.vocabularyRepository.findOne({ where: { id } });
      if (!vocabulary) {
        throw new NotFoundException('Vocabulary not found');
      }
      vocabulary.kanji = updateVocabularyDto.kanji;
      vocabulary.furigana = updateVocabularyDto.furigana;
      vocabulary.meaning = updateVocabularyDto.meaning;
      await this.vocabularyRepository.save(vocabulary);
      return { success: true };
    } catch (e) {
      console.error(e);
      throw new BadRequestException();
    }
  }

  async getGrammar(pageOptionsDto: PageOptionsDto, starred: boolean = false, keyword?: string) {
    let where: FindOptionsWhere<Grammar> | FindOptionsWhere<Grammar>[] | null = null;
    if (keyword) {
      where = [
        { grammar: Like(`%${keyword}%`) },
        { furigana: Like(`%${keyword}%`) },
        { meaning: Like(`%${keyword}%`) },
      ];
    }
    if (starred) {
      if (Array.isArray(where) && where.length) {
        where = where.map((item) => {
          item.star = true;
          return item;
        });
      } else {
        where = { star: true };
      }
    }

    const [grammars, total] = await this.grammarRepository.findAndCount({
      skip: pageOptionsDto.skip,
      take: pageOptionsDto.pageSize,
      order: { star: 'DESC', id: 'DESC' },
      where,
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

  async createGrammar(createGrammarDto: CreateGrammarDto) {
    const grammar = this.grammarRepository.create(createGrammarDto);
    await this.grammarRepository.save(grammar);
    return grammar;
  }

  async saveGrammarFile(file: Express.Multer.File) {
    const results: any[] = [];
    const bufferStream = new Readable();
    bufferStream.push(file.buffer);
    bufferStream.push(null);

    const upserts = [];
    bufferStream
      .pipe(csvParser({ headers: ['grammar', 'furigana', 'meaning', 'memo'], skipLines: 1 }))
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        for (const result of results) {
          upserts.push({
            grammar: result.grammar,
            furigana: result.furigana,
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

  async updateGrammar(id: number, updateGrammarDto: UpdateGrammarDto) {
    try {
      const grammar = await this.grammarRepository.findOne({ where: { id } });
      if (!grammar) {
        throw new NotFoundException('Grammar not found');
      }
      grammar.grammar = updateGrammarDto.grammar;
      grammar.furigana = updateGrammarDto.furigana;
      grammar.meaning = updateGrammarDto.meaning;
      grammar.memo = updateGrammarDto.memo;
      await this.grammarRepository.save(grammar);
      return { success: true };
    } catch (e) {
      console.error(e);
      throw new BadRequestException();
    }
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

  async getHonorific(type: HonorificType) {
    const honorifics = await this.honorificRepository.find({ where: { type } });
    return honorifics;
  }

  async getRiAdverb() {
    const riAdverbs = await this.riAdverbRepository.find();
    return riAdverbs;
  }

  async getOnomatopoeia() {
    const onomatopoeias = await this.onomatopoeiaRepository.find();
    return onomatopoeias;
  }
}
