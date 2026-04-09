import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { UserRole } from './enums/user-role.enum';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const email = registerDto.email.toLowerCase().trim();
    const username = registerDto.username.trim();

    const existingUserByEmail = await this.usersService.findByEmail(email);
    if (existingUserByEmail) {
      throw new BadRequestException('Email already in use');
    }

    const existingUserByUsername =
      await this.usersService.findByUsername(username);
    if (existingUserByUsername) {
      throw new BadRequestException('Username already in use');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const emailVerificationToken = randomUUID();
    const emailVerificationExpires = new Date(Date.now() + 1000 * 60 * 60 * 24);

    const user = await this.usersService.create({
      username,
      email,
      password: hashedPassword,
      avatar: registerDto.avatar ?? null,
      role: UserRole.PLAYER,
      isEmailVerified: false,
      emailVerificationToken,
      emailVerificationExpires,
      passwordResetToken: null,
      passwordResetExpires: null,
    });

    console.log('Email verification token:', emailVerificationToken);

    return {
      message:
        'User registered successfully. Verify your email before logging in.',
      user: this.sanitizeUser(user),
    };
  }

  async login(loginDto: LoginDto) {
    const email = loginDto.email.toLowerCase().trim();

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Email is not verified');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      message: 'Login successful',
      accessToken,
      user: this.sanitizeUser(user),
    };
  }

  private sanitizeUser(user: User) {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async verifyEmail(token: string) {
    const user = await this.usersService.findByEmailVerificationToken(token);

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    if (!user.emailVerificationExpires) {
      throw new BadRequestException('Verification token is invalid');
    }

    if (user.emailVerificationExpires.getTime() < Date.now()) {
      throw new BadRequestException('Verification token has expired');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;

    const updatedUser = await this.usersService.save(user);

    return {
      message: 'Email verified successfully',
      user: this.sanitizeUser(updatedUser),
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const email = forgotPasswordDto.email.toLowerCase().trim();

    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return {
        message:
          'If an account with this email exists, a reset token has been generated.',
      };
    }

    const passwordResetToken = randomUUID();
    const passwordResetExpires = new Date(Date.now() + 1000 * 60 * 30);

    user.passwordResetToken = passwordResetToken;
    user.passwordResetExpires = passwordResetExpires;

    await this.usersService.save(user);

    console.log('Password reset token:', passwordResetToken);

    return {
      message:
        'If an account with this email exists, a reset token has been generated.',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.usersService.findByPasswordResetToken(
      resetPasswordDto.token,
    );

    if (!user) {
      throw new BadRequestException('Invalid reset token');
    }

    if (!user.passwordResetExpires) {
      throw new BadRequestException('Reset token is invalid');
    }

    if (user.passwordResetExpires.getTime() < Date.now()) {
      throw new BadRequestException('Reset token has expired');
    }

    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);

    user.password = hashedPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    await this.usersService.save(user);

    return {
      message: 'Password reset successfully',
    };
  }
}
