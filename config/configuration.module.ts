import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import configuration from "./configuration";
import { ConfigurationService } from "./configuration.service";
import { join } from "path";

@Global()
@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    load: [configuration],
    envFilePath: join(process.cwd(), `.env.${process.env.NODE_ENV}`),
  })],
  providers: [ConfigurationService],
  exports: [ConfigurationService],
})
export class ConfigurationModule { }