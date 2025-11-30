export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  synchronize: boolean;
}

export interface AppConfig {
  database: DatabaseConfig;
}