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

  it('getMyProfile() retourne le profil prive du user connecte', async () => {
    const req = {
      user: { id: 'player-id', role: UserRole.PLAYER },
    };
    const userEntity = { id: 'player-id', username: 'alice' };
    const privateProfile = {
      id: 'player-id',
      username: 'alice',
      email: 'alice@test.dev',
    };

    usersServiceMock.findByIdOrFail.mockResolvedValue(userEntity);
    usersServiceMock.toPrivateProfile.mockReturnValue(privateProfile);

    await expect(controller.getMyProfile(req as never)).resolves.toEqual(
      privateProfile,
    );
    expect(usersServiceMock.findByIdOrFail).toHaveBeenCalledWith('player-id');
    expect(usersServiceMock.toPrivateProfile).toHaveBeenCalledWith(userEntity);
  });

  it('getPlayers() retourne des profils publics pour un visiteur', async () => {
    const req = {};
    const players = [
      { id: 'u1', username: 'alice' },
      { id: 'u2', username: 'bob' },
    ];
    const publicProfiles = [
      { id: 'u1', username: 'alice' },
      { id: 'u2', username: 'bob' },
    ];

    usersServiceMock.findAllPlayers.mockResolvedValue(players);
    usersServiceMock.toPublicProfile
      .mockReturnValueOnce(publicProfiles[0])
      .mockReturnValueOnce(publicProfiles[1]);

    await expect(controller.getPlayers(req as never)).resolves.toEqual(
      publicProfiles,
    );
    expect(usersServiceMock.findAllPlayers).toHaveBeenCalledTimes(1);
    expect(usersServiceMock.findAllUsers).not.toHaveBeenCalled();
  });

  it('getPlayers() retourne des profils prives pour un admin', async () => {
    const req = {
      user: { id: 'admin-id', role: UserRole.ADMIN },
    };
    const users = [
      { id: 'u1', username: 'alice', email: 'alice@test.dev' },
      { id: 'u2', username: 'bob', email: 'bob@test.dev' },
    ];
    const privateProfiles = [
      { id: 'u1', username: 'alice', email: 'alice@test.dev' },
      { id: 'u2', username: 'bob', email: 'bob@test.dev' },
    ];

    usersServiceMock.findAllUsers.mockResolvedValue(users);
    usersServiceMock.toPrivateProfile
      .mockReturnValueOnce(privateProfiles[0])
      .mockReturnValueOnce(privateProfiles[1]);

    await expect(controller.getPlayers(req as never)).resolves.toEqual(
      privateProfiles,
    );
    expect(usersServiceMock.findAllUsers).toHaveBeenCalledTimes(1);
    expect(usersServiceMock.findAllPlayers).not.toHaveBeenCalled();
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

  it('getPlayerStatsByUsername() resolve le user par username puis charge ses stats', async () => {
    const userEntity = { id: 'user-42', username: 'alice' };
    const stats = { wins: 3, losses: 1 };

    usersServiceMock.findByUsernameOrFail.mockResolvedValue(userEntity);
    usersServiceMock.getUserStats.mockResolvedValue(stats);

    await expect(controller.getPlayerStatsByUsername('alice')).resolves.toEqual(
      stats,
    );
    expect(usersServiceMock.findByUsernameOrFail).toHaveBeenCalledWith('alice');
    expect(usersServiceMock.getUserStats).toHaveBeenCalledWith('user-42');
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

  it('deleteUserAsAdmin() supprime le compte cible', async () => {
    const response = { message: 'User deleted successfully' };

    usersServiceMock.removeById.mockResolvedValue(response);

    await expect(controller.deleteUserAsAdmin('target-id')).resolves.toEqual(
      response,
    );
    expect(usersServiceMock.removeById).toHaveBeenCalledWith('target-id');
  });
});
