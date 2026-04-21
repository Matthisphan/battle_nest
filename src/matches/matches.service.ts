import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Tournament } from '../tournaments/entities/tournament.entity';
import { User } from '../users/entities/user.entity';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { Match } from './entities/match.entity';

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Match)
    private readonly matchesRepository: Repository<Match>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Tournament)
    private readonly tournamentsRepository: Repository<Tournament>,
  ) {}

  private async findUserOrFail(id: string) {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private async findTournamentOrNull(id?: string) {
    if (!id) {
      return null;
    }

    const tournament = await this.tournamentsRepository.findOne({
      where: { id },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    return tournament;
  }

  async create(createMatchDto: CreateMatchDto) {
    const [playerOne, playerTwo, winner, tournament] = await Promise.all([
      this.findUserOrFail(createMatchDto.playerOneId),
      this.findUserOrFail(createMatchDto.playerTwoId),
      createMatchDto.winnerId
        ? this.findUserOrFail(createMatchDto.winnerId)
        : Promise.resolve(null),
      this.findTournamentOrNull(createMatchDto.tournamentId),
    ]);

    const match = this.matchesRepository.create({
      playerOne,
      playerTwo,
      winner,
      tournament,
      score: createMatchDto.score ?? null,
      playedAt: new Date(createMatchDto.playedAt),
      status: createMatchDto.status,
    });

    return this.matchesRepository.save(match);
  }

  findAll() {
    return this.matchesRepository.find({
      relations: {
        tournament: true,
      },
      order: {
        playedAt: 'DESC',
      },
    });
  }

  async findByIdOrFail(id: string) {
    const match = await this.matchesRepository.findOne({
      where: { id },
      relations: {
        tournament: true,
      },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    return match;
  }

  async update(id: string, updateMatchDto: UpdateMatchDto) {
    const match = await this.findByIdOrFail(id);

    const [playerOne, playerTwo, winner, tournament] = await Promise.all([
      updateMatchDto.playerOneId
        ? this.findUserOrFail(updateMatchDto.playerOneId)
        : Promise.resolve(match.playerOne),
      updateMatchDto.playerTwoId
        ? this.findUserOrFail(updateMatchDto.playerTwoId)
        : Promise.resolve(match.playerTwo),
      updateMatchDto.winnerId
        ? this.findUserOrFail(updateMatchDto.winnerId)
        : Promise.resolve(match.winner),
      updateMatchDto.tournamentId
        ? this.findTournamentOrNull(updateMatchDto.tournamentId)
        : Promise.resolve(match.tournament),
    ]);

    Object.assign(match, {
      ...updateMatchDto,
      playerOne,
      playerTwo,
      winner,
      tournament,
      ...(updateMatchDto.playedAt
        ? { playedAt: new Date(updateMatchDto.playedAt) }
        : {}),
    });

    return this.matchesRepository.save(match);
  }

  async remove(id: string) {
    const match = await this.findByIdOrFail(id);

    await this.matchesRepository.remove(match);

    return { message: 'Match deleted successfully' };
  }
}
