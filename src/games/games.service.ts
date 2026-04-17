import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { Game } from './entities/game.entity';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(Game)
    private readonly gamesRepository: Repository<Game>,
  ) {}

  create(createGameDto: CreateGameDto) {
    const game = this.gamesRepository.create({
      ...createGameDto,
      releaseDate: new Date(createGameDto.releaseDate),
    });

    return this.gamesRepository.save(game);
  }

  findAll() {
    return this.gamesRepository.find({
      order: {
        releaseDate: 'DESC',
      },
    });
  }

  findOne(id: string) {
    return this.gamesRepository.findOne({ where: { id } });
  }

  async findOneOrFail(id: string) {
    const game = await this.findOne(id);

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    return game;
  }

  async update(id: string, updateGameDto: UpdateGameDto) {
    const game = await this.findOneOrFail(id);

    Object.assign(game, {
      ...updateGameDto,
      ...(updateGameDto.releaseDate
        ? { releaseDate: new Date(updateGameDto.releaseDate) }
        : {}),
    });

    return this.gamesRepository.save(game);
  }

  async remove(id: string) {
    const game = await this.findOneOrFail(id);

    await this.gamesRepository.remove(game);

    return { message: 'Game deleted successfully' };
  }
}
