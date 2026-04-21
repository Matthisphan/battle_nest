import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
} from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';
import { Match } from '../../matches/entities/match.entity';
import { User } from '../../users/entities/user.entity';
import { TournamentStatus } from '../enums/tournament-status.enum';

@Entity('tournaments')
export class Tournament extends BaseEntity {
  @Column({ type: 'varchar', unique: true, length: 150 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'date' })
  startDate!: Date;

  @Column({ type: 'date' })
  endDate!: Date;

  @Column({ type: 'int', default: 16 })
  maxParticipants!: number;

  @Column({
    type: 'enum',
    enum: TournamentStatus,
    default: TournamentStatus.UPCOMING,
  })
  status!: TournamentStatus;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'tournament_participants',
  })
  participants!: User[];

  @OneToMany(() => Match, (match) => match.tournament)
  matches!: Match[];
}
