import { BadRequestException, Controller, Get, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { PageOptionsDto } from './page/page-options.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('vocabulary')
  async getVocabulary(@Query() pageOptionsDto: PageOptionsDto) {
    return this.appService.getVocabulary(pageOptionsDto);
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

  @Get('grammar')
  async getGrammar(@Query() pageOptionsDto: PageOptionsDto) {
    return this.appService.getGrammar(pageOptionsDto);
  }
}
