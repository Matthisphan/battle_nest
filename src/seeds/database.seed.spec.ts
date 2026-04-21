import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ConfigService } from '@nestjs/config';

import { Game } from '../games/entities/game.entity';
import { Match } from '../matches/entities/match.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { UsersService } from '../users/users.service';
import { DatabaseSeed } from './database.seed';

describe('DatabaseSeed', () => {
  let seed: DatabaseSeed;

  const usersServiceMock = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  const configServiceMock = {
    get: jest.fn(),
  };

  const gamesRepositoryMock: Partial<Repository<Game>> = {
    findOne: jest.fn(),
    create: jest.fn((data) => data as Game),
    save: jest.fn((entity) => Promise.resolve(entity as Game)),
  };

  const tournamentsRepositoryMock: Partial<Repository<Tournament>> = {
    findOne: jest.fn(),
    create: jest.fn((data) => data as Tournament),
    save: jest.fn((entity) => Promise.resolve(entity as Tournament)),
  };

  const matchesRepositoryMock: Partial<Repository<Match>> = {
    findOne: jest.fn(),
    create: jest.fn((data) => data as Match),
    save: jest.fn((entity) => Promise.resolve(entity as Match)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    configServiceMock.get.mockImplementation((key: string) => {
      if (key === 'NODE_ENV') {
        return 'development';
      }
      if (key === 'SEED_ON_BOOT') {
        return 'true';
      }
      return undefined;
    });

    gamesRepositoryMock.findOne = jest.fn().mockResolvedValue(null);
    tournamentsRepositoryMock.findOne = jest.fn().mockResolvedValue(null);
    matchesRepositoryMock.findOne = jest.fn().mockResolvedValue(null);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseSeed,
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
        {
          provide: getRepositoryToken(Game),
          useValue: gamesRepositoryMock,
        },
        {
          provide: getRepositoryToken(Tournament),
          useValue: tournamentsRepositoryMock,
        },
        {
          provide: getRepositoryToken(Match),
          useValue: matchesRepositoryMock,
        },
      ],
    }).compile();

    seed = module.get<DatabaseSeed>(DatabaseSeed);
  });

  it('cree le compte banned@battle.com avec banned=true quand il est absent', async () => {
    usersServiceMock.findByEmail.mockResolvedValue(null);
    usersServiceMock.create.mockResolvedValue(undefined);

    await seed.onApplicationBootstrap();

    expect(usersServiceMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'banned@battle.com',
        username: 'banned-player',
        banned: true,
      }),
    );
  });

  it('ne cree pas le compte banned si l email existe deja', async () => {
    usersServiceMock.findByEmail.mockImplementation((email: string) => {
      if (email === 'banned@battle.com') {
        return Promise.resolve({ id: 'existing-banned-id' });
      }

      return Promise.resolve(null);
    });
    usersServiceMock.create.mockResolvedValue(undefined);

    await seed.onApplicationBootstrap();

    expect(usersServiceMock.create).not.toHaveBeenCalledWith(
      expect.objectContaining({ email: 'banned@battle.com' }),
    );
  });
});
