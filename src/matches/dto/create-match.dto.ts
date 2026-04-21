import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { MatchStatus } from '../enums/match-status.enum';

export class CreateMatchDto {
  @IsOptional()
  @IsUUID()
  tournamentId?: string;

  @IsUUID()
  playerOneId!: string;

  @IsUUID()
  playerTwoId!: string;

  @IsOptional()
  @IsUUID()
  winnerId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  score?: string;

  @IsDateString()
  playedAt!: string;

  @IsOptional()
  @IsEnum(MatchStatus)
  status?: MatchStatus;
}
