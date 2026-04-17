import { IsDateString, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateGameDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  publisher!: string;

  @IsDateString()
  releaseDate!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  genre!: string;
}
