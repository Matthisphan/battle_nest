import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { UserRole } from '../auth/enums/user-role.enum';
import { Game } from '../games/entities/game.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class DatabaseSeed implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseSeed.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    @InjectRepository(Game)
    private readonly gamesRepository: Repository<Game>,
  ) {}

  async onApplicationBootstrap() {
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    const seedOnBoot = this.configService.get<string>('SEED_ON_BOOT');

    if (nodeEnv !== 'development' || seedOnBoot !== 'true') {
      this.logger.log('Seed skipped');
      return;
    }

    await this.seedUsers();
    await this.seedGames();
  }

  private async seedUsers() {
    await this.createAdminIfMissing();
    await this.createPlayersIfMissing();
  }

  private async seedGames() {
    await this.createGamesIfMissing();
  }

  private async createAdminIfMissing() {
    const email = 'admin@battle.com';
    const existingAdmin = await this.usersService.findByEmail(email);

    if (existingAdmin) {
      this.logger.log('Admin account already exists');
      return;
    }

    const hashedPassword = await bcrypt.hash('Admin123!', 10);

    await this.usersService.create({
      username: 'admin',
      email,
      password: hashedPassword,
      avatar: null,
      displayName: 'Administrator',
      bio: 'Default admin account',
      country: 'France',
      favoriteGame: 'Street Fighter 6',
      role: UserRole.ADMIN,
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
      passwordResetToken: null,
      passwordResetExpires: null,
    });

    this.logger.log('Admin account created');
  }

  private async createPlayersIfMissing() {
    const players = [
      {
        username: 'player1',
        email: 'player1@battle.com',
        displayName: 'Player One',
        bio: 'Default player account',
        country: 'France',
        favoriteGame: 'Tekken 8',
      },
      {
        username: 'player2',
        email: 'player2@battle.com',
        displayName: 'Player Two',
        bio: 'Default player account',
        country: 'France',
        favoriteGame: 'Street Fighter 6',
      },
    ];

    const hashedPassword = await bcrypt.hash('Player123!', 10);

    for (const player of players) {
      const existingPlayer = await this.usersService.findByEmail(player.email);

      if (existingPlayer) {
        this.logger.log(`${player.username} already exists`);
        continue;
      }

      await this.usersService.create({
        username: player.username,
        email: player.email,
        password: hashedPassword,
        avatar: null,
        displayName: player.displayName,
        bio: player.bio,
        country: player.country,
        favoriteGame: player.favoriteGame,
        role: UserRole.PLAYER,
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        passwordResetToken: null,
        passwordResetExpires: null,
      });

      this.logger.log(`${player.username} account created`);
    }
  }

  private async createGamesIfMissing() {
    const games = [
      {
        name: 'Street Fighter 6',
        publisher: 'Capcom',
        releaseDate: new Date('2023-06-02'),
        genre: 'Fighting',
      },
      {
        name: 'Tekken 8',
        publisher: 'Bandai Namco',
        releaseDate: new Date('2024-01-26'),
        genre: 'Fighting',
      },
      {
        name: 'Guilty Gear Strive',
        publisher: 'Arc System Works',
        releaseDate: new Date('2021-06-11'),
        genre: 'Fighting',
      },
      {
        name: 'Mortal Kombat 1',
        publisher: 'Warner Bros. Games',
        releaseDate: new Date('2023-09-19'),
        genre: 'Fighting',
      },
      {
        name: 'Super Smash Bros. Ultimate',
        publisher: 'Nintendo',
        releaseDate: new Date('2018-12-07'),
        genre: 'Platform Fighting',
      },
    ];

    for (const gameData of games) {
      const existingGame = await this.gamesRepository.findOne({
        where: { name: gameData.name },
      });

      if (existingGame) {
        this.logger.log(`${gameData.name} already exists`);
        continue;
      }

      const game = this.gamesRepository.create(gameData);
      await this.gamesRepository.save(game);

      this.logger.log(`${gameData.name} created`);
    }
  }
}
