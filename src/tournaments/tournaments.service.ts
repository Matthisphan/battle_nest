import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UsersService } from '../users/users.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { Tournament } from './entities/tournament.entity';

@Injectable()
export class TournamentsService {
  constructor(
    @InjectRepository(Tournament)
    private readonly tournamentsRepository: Repository<Tournament>,
    private readonly usersService: UsersService,
  ) {}

  create(createTournamentDto: CreateTournamentDto) {
    const tournament = this.tournamentsRepository.create({
      ...createTournamentDto,
      description: createTournamentDto.description ?? null,
      startDate: new Date(createTournamentDto.startDate),
      endDate: new Date(createTournamentDto.endDate),
      participants: [],
    });

    return this.tournamentsRepository.save(tournament);
  }

  findAll() {
    return this.tournamentsRepository.find({
      relations: {
        participants: true,
      },
      order: {
        startDate: 'ASC',
      },
    });
  }

  async findByIdOrFail(id: string) {
    const tournament = await this.tournamentsRepository.findOne({
      where: { id },
      relations: {
        participants: true,
      },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    return tournament;
  }

  async update(id: string, updateTournamentDto: UpdateTournamentDto) {
    const tournament = await this.findByIdOrFail(id);

    Object.assign(tournament, {
      ...updateTournamentDto,
      ...(updateTournamentDto.startDate
        ? { startDate: new Date(updateTournamentDto.startDate) }
        : {}),
      ...(updateTournamentDto.endDate
        ? { endDate: new Date(updateTournamentDto.endDate) }
        : {}),
    });

    return this.tournamentsRepository.save(tournament);
  }

  async remove(id: string) {
    const tournament = await this.findByIdOrFail(id);

    await this.tournamentsRepository.remove(tournament);

    return { message: 'Tournament deleted successfully' };
  }

  async join(id: string, userId: string) {
    const tournament = await this.findByIdOrFail(id);
    const user = await this.usersService.findByIdOrFail(userId);

    if (user.banned) {
      throw new ForbiddenException('Your account is banned');
    }

    const isAlreadyJoined = tournament.participants.some(
      (participant) => participant.id === user.id,
    );

    if (isAlreadyJoined) {
      return {
        message: 'You already joined this tournament',
      };
    }

    if (tournament.participants.length >= tournament.maxParticipants) {
      throw new BadRequestException('Tournament is full');
    }

    tournament.participants.push(user);
    await this.tournamentsRepository.save(tournament);

    return {
      message: 'Tournament joined successfully',
    };
  }
}
