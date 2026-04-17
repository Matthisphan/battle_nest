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
});
