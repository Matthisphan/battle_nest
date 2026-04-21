import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  const usersServiceMock = {
    findByEmail: jest.fn(),
    findByUsername: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findByPasswordResetToken: jest.fn(),
    findByEmailVerificationToken: jest.fn(),
  };

  const jwtServiceMock = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('register() refuse un email deja utilise', async () => {
    usersServiceMock.findByEmail.mockResolvedValue({ id: 'existing-user' });

    await expect(
      service.register({
        username: 'player1',
        email: 'player1@test.dev',
        password: 'Password123!',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('login() refuse un compte banni', async () => {
    const passwordHash = await bcrypt.hash('Password123!', 10);

    usersServiceMock.findByEmail.mockResolvedValue({
      id: 'user-id',
      username: 'player1',
      email: 'player1@test.dev',
      password: passwordHash,
      isEmailVerified: true,
      banned: true,
    });

    await expect(
      service.login({
        email: 'player1@test.dev',
        password: 'Password123!',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('login() retourne un token pour des credentials valides', async () => {
    const passwordHash = await bcrypt.hash('Password123!', 10);

    usersServiceMock.findByEmail.mockResolvedValue({
      id: 'user-id',
      username: 'player1',
      email: 'player1@test.dev',
      password: passwordHash,
      avatar: null,
      role: 'player',
      isEmailVerified: true,
      banned: false,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-02'),
    });
    jwtServiceMock.signAsync.mockResolvedValue('jwt-token');

    const result = await service.login({
      email: 'player1@test.dev',
      password: 'Password123!',
    });

    expect(result.message).toBe('Login successful');
    expect(result.accessToken).toBe('jwt-token');
    expect(result.user).toEqual(
      expect.objectContaining({
        id: 'user-id',
        username: 'player1',
        email: 'player1@test.dev',
      }),
    );
  });

  it('login() refuse des credentials invalides', async () => {
    usersServiceMock.findByEmail.mockResolvedValue(null);

    await expect(
      service.login({
        email: 'unknown@test.dev',
        password: 'Password123!',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('resetPassword() refuse un token invalide', async () => {
    usersServiceMock.findByPasswordResetToken.mockResolvedValue(null);

    await expect(
      service.resetPassword({
        token: 'invalid-token',
        newPassword: 'NewPassword123!',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('forgotPassword() retourne un message generique pour un email inconnu', async () => {
    usersServiceMock.findByEmail.mockResolvedValue(null);

    const result = await service.forgotPassword({
      email: 'missing@test.dev',
    });

    expect(result.message).toContain('If an account with this email exists');
    expect(usersServiceMock.save).not.toHaveBeenCalled();
  });
});
