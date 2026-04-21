import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { User } from '../users/entities/user.entity';
import { MatchStatus } from './enums/match-status.enum';
import { Match } from './entities/match.entity';
import { MatchesService } from './matches.service';
describe('MatchesService', () => {
  let service: MatchesService;
  const matchesRepositoryMock = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };
  const usersRepositoryMock = {
    findOne: jest.fn(),
  };
  const tournamentsRepositoryMock = {
    findOne: jest.fn(),
  };
  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchesService,
        {
          provide: getRepositoryToken(Match),
          useValue: matchesRepositoryMock,
        },
        {
          provide: getRepositoryToken(User),
          useValue: usersRepositoryMock,
        },
        {
          provide: getRepositoryToken(Tournament),
          useValue: tournamentsRepositoryMock,
        },
      ],
    }).compile();
    service = module.get<MatchesService>(MatchesService);
  });
  it('create() cree un match en resolvant joueurs/tournoi et playedAt', async () => {
    const dto = {
      tournamentId: 't1',
      playerOneId: 'u1',
      playerTwoId: 'u2',
      winnerId: 'u1',
      score: '2-1',
      playedAt: '2026-06-01T20:00:00.000Z',
      status: MatchStatus.FINISHED,
    };

    const playerOne = { id: 'u1' };
    const playerTwo = { id: 'u2' };
    const winner = { id: 'u1' };
    const tournament = { id: 't1' };

    usersRepositoryMock.findOne
      .mockResolvedValueOnce(playerOne)
      .mockResolvedValueOnce(playerTwo)
      .mockResolvedValueOnce(winner);
    tournamentsRepositoryMock.findOne.mockResolvedValue(tournament);

    const created = {
      playerOne,
      playerTwo,
      winner,
      tournament,
      score: '2-1',
      playedAt: new Date('2026-06-01T20:00:00.000Z'),
      status: MatchStatus.FINISHED,
    };

    let createPayload: {
      playedAt: Date;
      status: MatchStatus;
    } | null = null;

    matchesRepositoryMock.create.mockImplementation((payload) => {
      createPayload = payload as {
        playedAt: Date;
        status: MatchStatus;
      };
      return created;
    });
    matchesRepositoryMock.save.mockResolvedValue(created);

    const result = await service.create(dto);

    expect(result).toEqual(created);
    expect(createPayload).not.toBeNull();
    expect(createPayload!.playedAt).toBeInstanceOf(Date);
    expect(createPayload!.status).toBe(MatchStatus.FINISHED);
  });
  it('create() lance NotFoundException si un joueur est introuvable', async () => {
    usersRepositoryMock.findOne.mockResolvedValueOnce(null);
    await expect(
      service.create({
        tournamentId: undefined,
        playerOneId: 'missing-user',
        playerTwoId: 'u2',
        winnerId: undefined,
        score: undefined,
        playedAt: '2026-06-01T20:00:00.000Z',
        status: MatchStatus.SCHEDULED,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
  it('update() conserve les relations existantes si ids absents et convertit playedAt', async () => {
    const existingMatch = {
      id: 'm1',
      playerOne: { id: 'u1' },
      playerTwo: { id: 'u2' },
      winner: null,
      tournament: null,
      status: MatchStatus.SCHEDULED,
      playedAt: new Date('2026-06-01T20:00:00.000Z'),
      score: null,
    };

    matchesRepositoryMock.findOne.mockResolvedValue(existingMatch);
    matchesRepositoryMock.save.mockResolvedValue(existingMatch);

    const result = await service.update('m1', {
      playedAt: '2026-06-02T20:00:00.000Z',
      score: '0-0',
    });

    expect(result.playedAt).toEqual(new Date('2026-06-02T20:00:00.000Z'));
    expect(result.playerOne).toEqual({ id: 'u1' });
    expect(result.playerTwo).toEqual({ id: 'u2' });
  });
  it('remove() supprime un match et retourne le message attendu', async () => {
    const match = { id: 'm1' };
    matchesRepositoryMock.findOne.mockResolvedValue(match);
    matchesRepositoryMock.remove.mockResolvedValue(match);
    await expect(service.remove('m1')).resolves.toEqual({
      message: 'Match deleted successfully',
    });
    expect(matchesRepositoryMock.remove).toHaveBeenCalledWith(match);
  });
});
