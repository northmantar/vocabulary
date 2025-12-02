import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity()
export class Grammar {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 512, comment: '문법 구문' })
  @Unique(['grammar'])
  grammar: string;

  @Column({ type: 'text', comment: '문법 구문 후리가나' })
  furigana: string;

  @Column({ type: 'text', comment: '문법 의미' })
  meaning: string;

  @Column({ type: 'text', comment: '추가 메모' })
  memo: string;

  @Column({ type: 'boolean', default: false, comment: '즐겨찾기' })
  star: boolean;
}
