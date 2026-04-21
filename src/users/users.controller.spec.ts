import { Test, TestingModule } from '@nestjs/testing';

import { UserRole } from '../auth/enums/user-role.enum';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;

  const usersServiceMock = {
    findByIdOrFail: jest.fn(),
    findAllUsers: jest.fn(),
    findAllPlayers: jest.fn(),
    findByUsernameOrFail: jest.fn(),
    findPublicByUsernameOrFail: jest.fn(),
    getUserStats: jest.fn(),
    setBanStatus: jest.fn(),
    removeById: jest.fn(),
    toPrivateProfile: jest.fn(),
    toPublicProfile: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('getPlayerByUsername() utilise la recherche publique pour un visiteur', async () => {
    const userEntity = { id: '1', username: 'alice' };
    const publicProfile = { id: '1', username: 'alice' };
    const req = {};

    usersServiceMock.findPublicByUsernameOrFail.mockResolvedValue(userEntity);
    usersServiceMock.toPublicProfile.mockReturnValue(publicProfile);

    await expect(
      controller.getPlayerByUsername('alice', req as never),
    ).resolves.toEqual(publicProfile);
    expect(usersServiceMock.findPublicByUsernameOrFail).toHaveBeenCalledWith(
      'alice',
    );
    expect(usersServiceMock.findByUsernameOrFail).not.toHaveBeenCalled();
  });

  it('getPlayerByUsername() utilise la recherche admin pour un admin', async () => {
    const userEntity = { id: '2', username: 'bob', email: 'bob@test.dev' };
    const privateProfile = {
      id: '2',
      username: 'bob',
      email: 'bob@test.dev',
    };
    const req = {
      user: { id: 'admin-id', role: UserRole.ADMIN },
    };

    usersServiceMock.findByUsernameOrFail.mockResolvedValue(userEntity);
    usersServiceMock.toPrivateProfile.mockReturnValue(privateProfile);

    await expect(
      controller.getPlayerByUsername('bob', req as never),
    ).resolves.toEqual(privateProfile);
    expect(usersServiceMock.findByUsernameOrFail).toHaveBeenCalledWith('bob');
    expect(usersServiceMock.findPublicByUsernameOrFail).not.toHaveBeenCalled();
  });

  it('getMyStats() retourne les stats du joueur connecte', async () => {
    const req = {
      user: { id: 'player-id', role: UserRole.PLAYER },
    };
    const stats = { wins: 4, losses: 2 };

    usersServiceMock.getUserStats.mockResolvedValue(stats);

    await expect(controller.getMyStats(req as never)).resolves.toEqual(stats);
    expect(usersServiceMock.getUserStats).toHaveBeenCalledWith('player-id');
  });

  it('setUserBanStatus() delegue le ban admin au service', async () => {
    const response = { message: 'User banned successfully' };

    usersServiceMock.setBanStatus.mockResolvedValue(response);

    await expect(
      controller.setUserBanStatus('target-id', { banned: true }),
    ).resolves.toEqual(response);
    expect(usersServiceMock.setBanStatus).toHaveBeenCalledWith(
      'target-id',
      true,
    );
  });

  it('deleteMyAccount() supprime le compte connecte', async () => {
    const req = {
      user: { id: 'player-id', role: UserRole.PLAYER },
    };
    const response = { message: 'User deleted successfully' };

    usersServiceMock.removeById.mockResolvedValue(response);

    await expect(controller.deleteMyAccount(req as never)).resolves.toEqual(
      response,
    );
    expect(usersServiceMock.removeById).toHaveBeenCalledWith('player-id');
  });
});
