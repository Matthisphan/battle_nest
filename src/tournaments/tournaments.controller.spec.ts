import { Test, TestingModule } from '@nestjs/testing';

import { TournamentsController } from './tournaments.controller';
import { TournamentsService } from './tournaments.service';

describe('TournamentsController', () => {
  let controller: TournamentsController;

  const tournamentsServiceMock = {
    findAll: jest.fn(),
    findByIdOrFail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    join: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TournamentsController],
      providers: [
        {
          provide: TournamentsService,
          useValue: tournamentsServiceMock,
        },
      ],
    }).compile();

    controller = module.get<TournamentsController>(TournamentsController);
  });

  it('create() cree un tournoi via le service', async () => {
    const dto = {
      name: 'Spring Clash',
      startDate: '2026-05-01',
      endDate: '2026-05-15',
      maxParticipants: 16,
    };
    const created = { id: 'tournament-id', ...dto };

    tournamentsServiceMock.create.mockResolvedValue(created);

    await expect(controller.create(dto)).resolves.toEqual(created);
    expect(tournamentsServiceMock.create).toHaveBeenCalledWith(dto);
  });

  it('update() met a jour un tournoi', async () => {
    const dto = { status: 'ongoing' };
    const updated = { id: 'tournament-id', ...dto };

    tournamentsServiceMock.update.mockResolvedValue(updated);

    await expect(controller.update('tournament-id', dto)).resolves.toEqual(
      updated,
    );
    expect(tournamentsServiceMock.update).toHaveBeenCalledWith(
      'tournament-id',
      dto,
    );
  });

  it('join() inscrit le joueur connecte au tournoi', async () => {
    const req = {
      user: {
        id: 'player-id',
      },
    };
    const response = { message: 'Tournament joined successfully' };

    tournamentsServiceMock.join.mockResolvedValue(response);

    await expect(controller.join('tournament-id', req as never)).resolves.toEqual(
      response,
    );
    expect(tournamentsServiceMock.join).toHaveBeenCalledWith(
      'tournament-id',
      'player-id',
    );
  });
});
