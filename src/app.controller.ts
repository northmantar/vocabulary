import { BadRequestException, Controller, Get, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Multer } from 'multer';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
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
}
