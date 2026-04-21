import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserRole } from '../auth/enums/user-role.enum';
import { Match } from '../matches/entities/match.entity';
import { MatchStatus } from '../matches/enums/match-status.enum';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Match)
    private readonly matchesRepository: Repository<Match>,
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

  async setBanStatus(id: string, banned: boolean) {
    const user = await this.findByIdOrFail(id);
    user.banned = banned;

    const updatedUser = await this.usersRepository.save(user);

    return {
      message: banned
        ? 'User banned successfully'
        : 'User unbanned successfully',
      user: this.toPrivateProfile(updatedUser),
    };
  }

  async removeById(id: string) {
    const user = await this.findByIdOrFail(id);

    await this.usersRepository.remove(user);

    return { message: 'User deleted successfully' };
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

  async getUserStats(userId: string) {
    await this.findByIdOrFail(userId);

    const matches = await this.matchesRepository.find({
      where: [{ playerOne: { id: userId } }, { playerTwo: { id: userId } }],
      relations: {
        playerOne: true,
        playerTwo: true,
        winner: true,
        tournament: true,
      },
      order: {
        playedAt: 'DESC',
      },
    });

    const finishedMatches = matches.filter(
      (match) => match.status === MatchStatus.FINISHED,
    );

    const wins = finishedMatches.filter(
      (match) => match.winner?.id === userId,
    ).length;

    const losses = finishedMatches.filter(
      (match) => !!match.winner && match.winner.id !== userId,
    ).length;

    const history = matches.map((match) => {
      const opponent =
        match.playerOne.id === userId ? match.playerTwo : match.playerOne;

      let result: 'win' | 'loss' | 'pending' = 'pending';

      if (match.status === MatchStatus.FINISHED && match.winner) {
        result = match.winner.id === userId ? 'win' : 'loss';
      }

      return {
        matchId: match.id,
        playedAt: match.playedAt,
        status: match.status,
        score: match.score,
        result,
        tournament: match.tournament
          ? {
              id: match.tournament.id,
              name: match.tournament.name,
            }
          : null,
        opponent: {
          id: opponent.id,
          username: opponent.username,
        },
      };
    });

    const totalFinishedMatches = finishedMatches.length;

    return {
      totalMatches: matches.length,
      totalFinishedMatches,
      wins,
      losses,
      winRate:
        totalFinishedMatches === 0
          ? 0
          : Number(((wins / totalFinishedMatches) * 100).toFixed(2)),
      history,
    };
  }

  async findByIdOrFail(id: string) {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
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
      where: { username: username.trim() },
    });
  }

  async findByUsernameOrFail(username: string) {
    const user = await this.findByUsername(username);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findPublicByUsernameOrFail(username: string) {
    const user = await this.usersRepository.findOne({
      where: {
        username: username.trim(),
        role: UserRole.PLAYER,
      },
    });

    if (!user) {
      throw new NotFoundException('Player not found');
    }

    return user;
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
      banned: user.banned,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
