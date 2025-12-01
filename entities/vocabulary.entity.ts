import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity()
export class Vocabulary {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 512, comment: '한자' })
  @Unique(['kanji'])
  kanji: string;

  @Column({ type: 'text', comment: '후리가나' })
  furigana: string;

  @Column({ type: 'text', comment: '단어 뜻' })
  meaning: string;

  @Column({ type: 'boolean', default: false, comment: '즐겨찾기' })
  star: boolean;
}