import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from '../users/users.service';
import { TournamentStatus } from './enums/tournament-status.enum';
import { Tournament } from './entities/tournament.entity';
import { TournamentsService } from './tournaments.service';
describe('TournamentsService', () => {
  let service: TournamentsService;
  const tournamentsRepositoryMock = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    find: jest.fn(),
  };
  const usersServiceMock = {
    findByIdOrFail: jest.fn(),
  };
  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TournamentsService,
        {
          provide: getRepositoryToken(Tournament),
          useValue: tournamentsRepositoryMock,
        },
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
      ],
    }).compile();
    service = module.get<TournamentsService>(TournamentsService);
  });
  it('create() convertit les dates en Date et initialise participants', async () => {
    const dto = {
      name: 'Spring Clash 2026',
      description: 'Tournoi de printemps',
      startDate: '2026-05-01',
      endDate: '2026-05-15',
      maxParticipants: 16,
      status: TournamentStatus.UPCOMING,
    };

    const created = {
      ...dto,
      startDate: new Date('2026-05-01'),
      endDate: new Date('2026-05-15'),
      participants: [],
    };

    let createPayload: {
      startDate: Date;
      endDate: Date;
      participants: unknown[];
    } | null = null;

    tournamentsRepositoryMock.create.mockImplementation((payload) => {
      createPayload = payload as {
        startDate: Date;
        endDate: Date;
        participants: unknown[];
      };
      return created;
    });
    tournamentsRepositoryMock.save.mockResolvedValue(created);

    await expect(service.create(dto)).resolves.toEqual(created);

    expect(createPayload).not.toBeNull();
    expect(createPayload!.startDate).toBeInstanceOf(Date);
    expect(createPayload!.endDate).toBeInstanceOf(Date);
    expect(createPayload!.participants).toEqual([]);
  });
  it('join() refuse un utilisateur banni', async () => {
    const tournament = {
      id: 't1',
      maxParticipants: 8,
      participants: [],
    };
    tournamentsRepositoryMock.findOne.mockResolvedValue(tournament);
    usersServiceMock.findByIdOrFail.mockResolvedValue({
      id: 'u1',
      banned: true,
    });
    await expect(service.join('t1', 'u1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
  it('join() retourne un message si le joueur a deja rejoint', async () => {
    const tournament = {
      id: 't1',
      maxParticipants: 8,
      participants: [{ id: 'u1' }],
    };
    tournamentsRepositoryMock.findOne.mockResolvedValue(tournament);
    usersServiceMock.findByIdOrFail.mockResolvedValue({
      id: 'u1',
      banned: false,
    });
    await expect(service.join('t1', 'u1')).resolves.toEqual({
      message: 'You already joined this tournament',
    });
    expect(tournamentsRepositoryMock.save).not.toHaveBeenCalled();
  });
  it('join() refuse un tournoi plein', async () => {
    const tournament = {
      id: 't1',
      maxParticipants: 1,
      participants: [{ id: 'u2' }],
    };
    tournamentsRepositoryMock.findOne.mockResolvedValue(tournament);
    usersServiceMock.findByIdOrFail.mockResolvedValue({
      id: 'u1',
      banned: false,
    });
    await expect(service.join('t1', 'u1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
  it('join() ajoute le joueur si toutes les conditions sont valides', async () => {
    const tournament = {
      id: 't1',
      maxParticipants: 8,
      participants: [],
    };
    const user = {
      id: 'u1',
      banned: false,
    };
    tournamentsRepositoryMock.findOne.mockResolvedValue(tournament);
    usersServiceMock.findByIdOrFail.mockResolvedValue(user);
    tournamentsRepositoryMock.save.mockResolvedValue({
      ...tournament,
      participants: [user],
    });
    await expect(service.join('t1', 'u1')).resolves.toEqual({
      message: 'Tournament joined successfully',
    });
    expect(tournamentsRepositoryMock.save).toHaveBeenCalledWith(
      expect.objectContaining({ participants: [user] }),
    );
  });
  it('findByIdOrFail() lance NotFoundException si tournoi absent', async () => {
    tournamentsRepositoryMock.findOne.mockResolvedValue(null);
    await expect(service.findByIdOrFail('missing-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
