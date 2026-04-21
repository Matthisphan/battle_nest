import { Test, TestingModule } from '@nestjs/testing';

import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';

describe('MatchesController', () => {
  let controller: MatchesController;

  const matchesServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByIdOrFail: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MatchesController],
      providers: [
        {
          provide: MatchesService,
          useValue: matchesServiceMock,
        },
      ],
    }).compile();

    controller = module.get<MatchesController>(MatchesController);
  });

  it('create() cree un match via le service', async () => {
    const dto = {
      tournamentId: 't1',
      playerOneId: 'p1',
      playerTwoId: 'p2',
      winnerId: 'p1',
      score: '2-1',
      playedAt: '2026-06-01T20:00:00.000Z',
      status: 'finished',
    };
    const created = { id: 'm1', ...dto };

    matchesServiceMock.create.mockResolvedValue(created);

    await expect(controller.create(dto as never)).resolves.toEqual(created);
    expect(matchesServiceMock.create).toHaveBeenCalledWith(dto);
  });

  it('findAll() retourne les matchs', async () => {
    const matches = [{ id: 'm1' }, { id: 'm2' }];

    matchesServiceMock.findAll.mockResolvedValue(matches);

    await expect(controller.findAll()).resolves.toEqual(matches);
    expect(matchesServiceMock.findAll).toHaveBeenCalledTimes(1);
  });

  it('findOne() retourne un match par id', async () => {
    const match = { id: 'm1' };

    matchesServiceMock.findByIdOrFail.mockResolvedValue(match);

    await expect(controller.findOne('m1')).resolves.toEqual(match);
    expect(matchesServiceMock.findByIdOrFail).toHaveBeenCalledWith('m1');
  });

  it('update() met a jour un match', async () => {
    const dto = { score: '3-2' };
    const updated = { id: 'm1', score: '3-2' };

    matchesServiceMock.update.mockResolvedValue(updated);

    await expect(controller.update('m1', dto as never)).resolves.toEqual(
      updated,
    );
    expect(matchesServiceMock.update).toHaveBeenCalledWith('m1', dto);
  });

  it('remove() supprime un match', async () => {
    const response = { message: 'Match deleted successfully' };

    matchesServiceMock.remove.mockResolvedValue(response);

    await expect(controller.remove('m1')).resolves.toEqual(response);
    expect(matchesServiceMock.remove).toHaveBeenCalledWith('m1');
  });
});
