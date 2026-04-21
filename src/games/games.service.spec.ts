import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Game } from './entities/game.entity';
import { GamesService } from './games.service';

describe('GamesService', () => {
  let service: GamesService;

  const gamesRepositoryMock = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamesService,
        {
          provide: getRepositoryToken(Game),
          useValue: gamesRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<GamesService>(GamesService);
  });

  it('findByName() trim le nom avant la recherche', async () => {
    const game = { id: 'g1', name: 'Tekken 8' };
    gamesRepositoryMock.findOne.mockResolvedValue(game);

    await expect(service.findByName('  Tekken 8  ')).resolves.toEqual(game);
    expect(gamesRepositoryMock.findOne).toHaveBeenCalledWith({
      where: { name: 'Tekken 8' },
    });
  });

  it('findByNameOrFail() lance NotFoundException si le jeu est absent', async () => {
    gamesRepositoryMock.findOne.mockResolvedValue(null);

    await expect(service.findByNameOrFail('Unknown')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('create() convertit releaseDate en Date avant sauvegarde', async () => {
    const dto = {
      name: 'Street Fighter 6',
      publisher: 'Capcom',
      releaseDate: '2023-06-02',
      genre: 'Fighting',
    };

    const created = {
      ...dto,
      releaseDate: new Date('2023-06-02'),
    };

    gamesRepositoryMock.create.mockReturnValue(created);
    gamesRepositoryMock.save.mockResolvedValue(created);

    await expect(service.create(dto)).resolves.toEqual(created);
    expect(gamesRepositoryMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: dto.name,
        releaseDate: expect.any(Date),
      }),
    );
  });

  it('update() met a jour le jeu par name et convertit releaseDate', async () => {
    const game = {
      id: 'g1',
      name: 'Tekken 8',
      publisher: 'Bandai Namco',
      releaseDate: new Date('2024-01-26'),
    };

    const dto = {
      publisher: 'Bandai Namco Entertainment',
      releaseDate: '2024-02-01',
    };

    gamesRepositoryMock.findOne.mockResolvedValue(game);
    gamesRepositoryMock.save.mockImplementation(async (entity) => entity);

    const updated = await service.update('  Tekken 8  ', dto);

    expect(gamesRepositoryMock.findOne).toHaveBeenCalledWith({
      where: { name: 'Tekken 8' },
    });
    expect(updated.publisher).toBe('Bandai Namco Entertainment');
    expect(updated.releaseDate).toEqual(new Date('2024-02-01'));
  });

  it('remove() supprime le jeu trouve par name', async () => {
    const game = { id: 'g1', name: 'Tekken 8' };

    gamesRepositoryMock.findOne.mockResolvedValue(game);
    gamesRepositoryMock.remove.mockResolvedValue(game);

    await expect(service.remove('Tekken 8')).resolves.toEqual({
      message: 'Game deleted successfully',
    });
    expect(gamesRepositoryMock.remove).toHaveBeenCalledWith(game);
  });
});

