import { IsBoolean } from 'class-validator';

export class SetUserBanDto {
  @IsBoolean()
  banned!: boolean;
}
