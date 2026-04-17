import { Test, TestingModule } from '@nestjs/testing';

import { GamesController } from './games.controller';
import { GamesService } from './games.service';

describe('GamesController', () => {
  let controller: GamesController;

  const gamesServiceMock = {
    findAll: jest.fn(),
    findByNameOrFail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GamesController],
      providers: [
        {
          provide: GamesService,
          useValue: gamesServiceMock,
        },
      ],
    }).compile();

    controller = module.get<GamesController>(GamesController);
  });

  it('findOne() recherche un jeu par name', async () => {
    const game = {
      id: 'game-id',
      name: 'Dota 2',
    };

    gamesServiceMock.findByNameOrFail.mockResolvedValue(game);

    await expect(controller.findOne('Dota 2')).resolves.toEqual(game);
    expect(gamesServiceMock.findByNameOrFail).toHaveBeenCalledWith('Dota 2');
  });

  it('update() met a jour un jeu via son name', async () => {
    const dto = { publisher: 'Valve' };
    const updated = {
      id: 'game-id',
      name: 'Dota 2',
      publisher: 'Valve',
    };

    gamesServiceMock.update.mockResolvedValue(updated);

    await expect(controller.update('Dota 2', dto)).resolves.toEqual(updated);
    expect(gamesServiceMock.update).toHaveBeenCalledWith('Dota 2', dto);
  });

  it('remove() supprime un jeu via son name', async () => {
    const response = { message: 'Game deleted successfully' };

    gamesServiceMock.remove.mockResolvedValue(response);

    await expect(controller.remove('Dota 2')).resolves.toEqual(response);
    expect(gamesServiceMock.remove).toHaveBeenCalledWith('Dota 2');
  });
});

