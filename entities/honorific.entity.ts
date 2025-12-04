import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { HonorificType } from './enum/honorific-type.enum';

@Entity()
export class Honorific {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 20, comment: '경어 타입', enum: HonorificType })
  type: HonorificType;

  @Column({ type: 'varchar', length: 512, comment: '한자' })
  kanji: string;

  @Column({ type: 'varchar', length: 512, comment: '후리가나' })
  furigana: string;

  @Column({ type: 'text', comment: '의미' })
  meaning: string;
}
