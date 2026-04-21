import { Test, TestingModule } from '@nestjs/testing';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const authServiceMock = {
    register: jest.fn(),
    login: jest.fn(),
    verifyEmail: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('register() cree un compte', async () => {
    const dto = {
      username: 'alice',
      email: 'alice@test.dev',
      password: 'Password123!',
    };
    const response = { message: 'User registered successfully' };

    authServiceMock.register.mockResolvedValue(response);

    await expect(controller.register(dto)).resolves.toEqual(response);
    expect(authServiceMock.register).toHaveBeenCalledWith(dto);
  });

  it('login() delegue la connexion au service', async () => {
    const dto = {
      email: 'alice@test.dev',
      password: 'Password123!',
    };
    const response = { accessToken: 'jwt-token' };

    authServiceMock.login.mockResolvedValue(response);

    await expect(controller.login(dto)).resolves.toEqual(response);
    expect(authServiceMock.login).toHaveBeenCalledWith(dto);
  });

  it('verifyEmail() verifie un token email', async () => {
    const response = { message: 'Email verified successfully' };

    authServiceMock.verifyEmail.mockResolvedValue(response);

    await expect(controller.verifyEmail('token-123')).resolves.toEqual(
      response,
    );
    expect(authServiceMock.verifyEmail).toHaveBeenCalledWith('token-123');
  });

  it('forgotPassword() declenche la procedure de reset', async () => {
    const dto = {
      email: 'alice@test.dev',
    };
    const response = {
      message: 'If the account exists, reset instructions were sent',
    };

    authServiceMock.forgotPassword.mockResolvedValue(response);

    await expect(controller.forgotPassword(dto)).resolves.toEqual(response);
    expect(authServiceMock.forgotPassword).toHaveBeenCalledWith(dto);
  });

  it('resetPassword() met a jour le mot de passe via token', async () => {
    const dto = {
      token: 'reset-token',
      newPassword: 'NewPassword123!',
    };
    const response = { message: 'Password reset successfully' };

    authServiceMock.resetPassword.mockResolvedValue(response);

    await expect(controller.resetPassword(dto)).resolves.toEqual(response);
    expect(authServiceMock.resetPassword).toHaveBeenCalledWith(dto);
  });
});
