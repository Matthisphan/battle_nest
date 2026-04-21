import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { UserRole } from '../auth/enums/user-role.enum';
import { Match } from '../matches/entities/match.entity';
import { MatchStatus } from '../matches/enums/match-status.enum';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  const usersRepositoryMock = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const matchesRepositoryMock = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: usersRepositoryMock,
        },
        {
          provide: getRepositoryToken(Match),
          useValue: matchesRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('setBanStatus() met a jour le flag banned', async () => {
    const user = {
      id: 'user-id',
      username: 'player1',
      email: 'player1@test.dev',
      banned: false,
      role: 'player',
      isEmailVerified: true,
      avatar: null,
      displayName: null,
      bio: null,
      country: null,
      favoriteGame: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    usersRepositoryMock.findOne.mockResolvedValue(user);
    usersRepositoryMock.save.mockImplementation(async (u) => u);

    const result = await service.setBanStatus('user-id', true);

    expect(result.message).toBe('User banned successfully');
    expect(usersRepositoryMock.save).toHaveBeenCalledWith(
      expect.objectContaining({ banned: true }),
    );
  });

  it('getUserStats() calcule wins, losses et historique', async () => {
    const user = {
      id: 'user-id',
      username: 'player1',
      email: 'player1@test.dev',
      banned: false,
    };

    usersRepositoryMock.findOne.mockResolvedValue(user);
    matchesRepositoryMock.find.mockResolvedValue([
      {
        id: 'match-1',
        playedAt: new Date('2026-01-01'),
        status: MatchStatus.FINISHED,
        score: '2-0',
        playerOne: { id: 'user-id', username: 'player1' },
        playerTwo: { id: 'user-2', username: 'player2' },
        winner: { id: 'user-id' },
        tournament: { id: 't-1', name: 'Winter Cup' },
      },
      {
        id: 'match-2',
        playedAt: new Date('2026-01-02'),
        status: MatchStatus.FINISHED,
        score: '0-2',
        playerOne: { id: 'user-2', username: 'player2' },
        playerTwo: { id: 'user-id', username: 'player1' },
        winner: { id: 'user-2' },
        tournament: null,
      },
      {
        id: 'match-3',
        playedAt: new Date('2026-01-03'),
        status: MatchStatus.SCHEDULED,
        score: null,
        playerOne: { id: 'user-id', username: 'player1' },
        playerTwo: { id: 'user-3', username: 'player3' },
        winner: null,
        tournament: null,
      },
    ]);

    const stats = await service.getUserStats('user-id');

    expect(stats.totalMatches).toBe(3);
    expect(stats.totalFinishedMatches).toBe(2);
    expect(stats.wins).toBe(1);
    expect(stats.losses).toBe(1);
    expect(stats.winRate).toBe(50);
    expect(stats.history).toHaveLength(3);
  });

  it('removeById() lance NotFound si utilisateur absent', async () => {
    usersRepositoryMock.findOne.mockResolvedValue(null);

    await expect(service.removeById('missing-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('findByUsernameOrFail() trim le username et retourne le user', async () => {
    const user = {
      id: 'user-id',
      username: 'player1',
      email: 'player1@test.dev',
    };

    usersRepositoryMock.findOne.mockResolvedValue(user);

    await expect(service.findByUsernameOrFail('  player1  ')).resolves.toEqual(
      user,
    );
    expect(usersRepositoryMock.findOne).toHaveBeenCalledWith({
      where: { username: 'player1' },
    });
  });

  it('findByUsernameOrFail() lance NotFoundException si absent', async () => {
    usersRepositoryMock.findOne.mockResolvedValue(null);

    await expect(service.findByUsernameOrFail('missing-user')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('findPublicByUsernameOrFail() recherche un player par username', async () => {
    const player = {
      id: 'player-id',
      username: 'player2',
      role: UserRole.PLAYER,
    };

    usersRepositoryMock.findOne.mockResolvedValue(player);

    await expect(
      service.findPublicByUsernameOrFail('  player2  '),
    ).resolves.toEqual(player);
    expect(usersRepositoryMock.findOne).toHaveBeenCalledWith({
      where: {
        username: 'player2',
        role: UserRole.PLAYER,
      },
    });
  });

  it('findPublicByUsernameOrFail() lance NotFoundException si joueur absent', async () => {
    usersRepositoryMock.findOne.mockResolvedValue(null);

    await expect(
      service.findPublicByUsernameOrFail('unknown-player'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
