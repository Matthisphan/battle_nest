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

export class UpdateMatchDto {
  @IsOptional()
  @IsUUID()
  tournamentId?: string;

  @IsOptional()
  @IsUUID()
  playerOneId?: string;

  @IsOptional()
  @IsUUID()
  playerTwoId?: string;

  @IsOptional()
  @IsUUID()
  winnerId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  score?: string;

  @IsOptional()
  @IsDateString()
  playedAt?: string;

  @IsOptional()
  @IsEnum(MatchStatus)
  status?: MatchStatus;
}
