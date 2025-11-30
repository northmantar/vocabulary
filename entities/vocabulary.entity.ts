import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Vocabulary {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', comment: '한자' })
  kanji: string;

  @Column({ type: 'text', comment: '후리가나' })
  furigana: string;

  @Column({ type: 'text', comment: '단어 뜻' })
  meaning: string;
}