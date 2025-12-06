import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { OnomatopoeiaCategory } from './enum/onomatopoeia-category.enum';

@Entity()
export class Onomatopoeia {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, comment: '의성/의태어 카테고리', enum: OnomatopoeiaCategory })
  category: string;

  @Column({ type: 'varchar', length: 512, comment: '의성/의태어 후리가나' })
  furigana: string;

  @Column({ type: 'text', comment: '의성/의태어 의미' })
  meaning: string;
}
