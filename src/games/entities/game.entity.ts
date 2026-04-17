import { Column, Entity } from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';

@Entity('games')
export class Game extends BaseEntity {
  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'varchar', length: 150 })
  publisher!: string;

  @Column({ type: 'date' })
  releaseDate!: Date;

  @Column({ type: 'varchar', length: 100 })
  genre!: string;
}
