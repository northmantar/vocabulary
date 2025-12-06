import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class RiAdverb {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 512, comment: '리로 끝나는 부사 후리가나' })
  furigana: string;

  @Column({ type: 'text', comment: '리로 끝나는 부사 의미' })
  meaning: string;
}
