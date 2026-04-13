import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserRole } from '../auth/enums/user-role.enum';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  create(data: Partial<User>) {
    const user = this.usersRepository.create(data);
    return this.usersRepository.save(user);
  }

  save(user: User) {
    return this.usersRepository.save(user);
  }

  findAllUsers() {
    return this.usersRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  findAllPlayers() {
    return this.usersRepository.find({
      where: {
        role: UserRole.PLAYER,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  findById(id: string) {
    return this.usersRepository.findOne({
      where: { id },
    });
  }

  async findByIdOrFail(id: string) {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findPublicByIdOrFail(id: string) {
    const user = await this.usersRepository.findOne({
      where: {
        id,
        role: UserRole.PLAYER,
      },
    });

    if (!user) {
      throw new NotFoundException('Player not found');
    }

    return user;
  }

  findByEmail(email: string) {
    return this.usersRepository.findOne({
      where: { email },
    });
  }

  findByUsername(username: string) {
    return this.usersRepository.findOne({
      where: { username },
    });
  }

  findByEmailVerificationToken(token: string) {
    return this.usersRepository.findOne({
      where: { emailVerificationToken: token },
    });
  }

  findByPasswordResetToken(token: string) {
    return this.usersRepository.findOne({
      where: { passwordResetToken: token },
    });
  }

  toPublicProfile(user: User) {
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      bio: user.bio,
      country: user.country,
      favoriteGame: user.favoriteGame,
      createdAt: user.createdAt,
    };
  }

  toPrivateProfile(user: User) {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      displayName: user.displayName,
      bio: user.bio,
      country: user.country,
      favoriteGame: user.favoriteGame,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
