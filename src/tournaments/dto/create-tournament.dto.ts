import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

import { TournamentStatus } from '../enums/tournament-status.enum';

export class CreateTournamentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsInt()
  @Min(2)
  maxParticipants!: number;

  @IsOptional()
  @IsEnum(TournamentStatus)
  status?: TournamentStatus;
}
