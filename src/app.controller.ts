import {
  BadRequestException,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { PageOptionsDto } from './page/page-options.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('vocabulary')
  async getVocabulary(@Query() pageOptionsDto: PageOptionsDto, @Query('starred') starred: boolean = false) {
    return this.appService.getVocabulary(pageOptionsDto, starred);
  }

  @Get('vocabulary/:id')
  async getVocabularyById(@Param('id') id: number) {
    return this.appService.getVocabularyById(id);
  }

  @Post('vocabulary')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'text/csv') {
          cb(null, true);
        } else {
          cb(new BadRequestException('Invalid file type'), false);
        }
      },
    }),
  )
  async saveVocabularyFile(@UploadedFile() file: Express.Multer.File) {
    await this.appService.saveVocabularyFile(file);
  }

  @Get('grammar')
  async getGrammar(@Query() pageOptionsDto: PageOptionsDto, @Query('starred') starred: boolean = false) {
    return this.appService.getGrammar(pageOptionsDto, starred);
  }

  @Get('grammar/:id')
  async getGrammarById(@Param('id') id: number) {
    return this.appService.getGrammarById(id);
  }

  @Post('grammar')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'text/csv') {
          cb(null, true);
        } else {
          cb(new BadRequestException('Invalid file type'), false);
        }
      },
    }),
  )
  async saveGrammarFile(@UploadedFile() file: Express.Multer.File) {
    await this.appService.saveGrammarFile(file);
  }

  @Post('vocabulary/:id/star')
  async starVocabulary(@Param('id') id: number) {
    return await this.appService.starVocabulary(id);
  }

  @Post('grammar/:id/star')
  async starGrammar(@Param('id') id: number) {
    return await this.appService.starGrammar(id);
  }
}
