import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Grammar {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', comment: '문법 구문' })
  grammar: string;

  @Column({ type: 'text', comment: '문법 의미' })
  meaning: string;

  @Column({ type: 'text', comment: '추가 메모' })
  memo: string;
}