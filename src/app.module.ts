import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigurationModule } from 'config/configuration.module';
import { ConfigurationService } from 'config/configuration.service';
import { Vocabulary } from 'entities/vocabulary.entity';
import { Grammar } from 'entities/grammar.entity';

@Module({
  imports: [
    ConfigurationModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigurationModule],
      useFactory: (configurationService: ConfigurationService) => ({
        type: 'mysql',
        ...configurationService.database,
        entities: [Vocabulary, Grammar],
      }),
      inject: [ConfigurationService],
    }),
    TypeOrmModule.forFeature([Vocabulary, Grammar]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
