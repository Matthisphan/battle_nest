import { Column, Entity, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';
import { Tournament } from '../../tournaments/entities/tournament.entity';
import { User } from '../../users/entities/user.entity';
import { MatchStatus } from '../enums/match-status.enum';

@Entity('matches')
export class Match extends BaseEntity {
  @ManyToOne(() => Tournament, (tournament) => tournament.matches, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  tournament!: Tournament | null;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
    eager: true,
  })
  playerOne!: User;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
    eager: true,
  })
  playerTwo!: User;

  @ManyToOne(() => User, {
    nullable: true,
    onDelete: 'SET NULL',
    eager: true,
  })
  winner!: User | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  score!: string | null;

  @Column({ type: 'timestamp' })
  playedAt!: Date;

  @Column({
    type: 'enum',
    enum: MatchStatus,
    default: MatchStatus.SCHEDULED,
  })
  status!: MatchStatus;
}
