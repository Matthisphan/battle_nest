import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { UserRole } from '../auth/enums/user-role.enum';
import { UsersService } from '../users/users.service';

@Injectable()
export class DatabaseSeed implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseSeed.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    const seedOnBoot = this.configService.get<string>('SEED_ON_BOOT');

    if (nodeEnv !== 'development' || seedOnBoot !== 'true') {
      this.logger.log('Seed skipped');
      return;
    }

    await this.seedUsers();
  }

  private async seedUsers() {
    await this.createAdminIfMissing();
    await this.createPlayersIfMissing();
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
}
