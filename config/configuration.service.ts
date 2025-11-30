import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppConfig, DatabaseConfig } from "./configuration.interface";

@Injectable()
export class ConfigurationService {
  private readonly config: AppConfig;
  constructor(private configService: ConfigService) {
    this.config = {
      database: this.configService.getOrThrow<DatabaseConfig>('database')
    }
  }

  get database() {
    return this.config.database;
  }
}