import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { UserRole } from '../auth/enums/user-role.enum';
import { Game } from '../games/entities/game.entity';
import { Match } from '../matches/entities/match.entity';
import { MatchStatus } from '../matches/enums/match-status.enum';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { TournamentStatus } from '../tournaments/enums/tournament-status.enum';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class DatabaseSeed implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseSeed.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    @InjectRepository(Game)
    private readonly gamesRepository: Repository<Game>,
    @InjectRepository(Tournament)
    private readonly tournamentsRepository: Repository<Tournament>,
    @InjectRepository(Match)
    private readonly matchesRepository: Repository<Match>,
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
    await this.seedTournaments();
    await this.seedMatches();
  }

  private async seedUsers() {
    await this.createAdminIfMissing();
    await this.createPlayersIfMissing();
  }

  private async seedGames() {
    await this.createGamesIfMissing();
  }

  private async seedTournaments() {
    await this.createTournamentsIfMissing();
  }

  private async seedMatches() {
    await this.createMatchesIfMissing();
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
      banned: false,
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
        banned: false,
      },
      {
        username: 'player2',
        email: 'player2@battle.com',
        displayName: 'Player Two',
        bio: 'Default player account',
        country: 'France',
        favoriteGame: 'Street Fighter 6',
        banned: false,
      },
      {
        username: 'player3',
        email: 'player3@battle.com',
        displayName: 'Player Three',
        bio: 'Default player account',
        country: 'France',
        favoriteGame: 'Guilty Gear Strive',
        banned: false,
      },
      {
        username: 'banned-player',
        email: 'banned@battle.com',
        displayName: 'Banned Player',
        bio: 'Default banned account for demos',
        country: 'France',
        favoriteGame: 'Street Fighter 6',
        banned: true,
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
        banned: player.banned,
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

  private async createTournamentsIfMissing() {
    const player1 = await this.usersService.findByEmail('player1@battle.com');
    const player2 = await this.usersService.findByEmail('player2@battle.com');
    const player3 = await this.usersService.findByEmail('player3@battle.com');

    if (!player1 || !player2 || !player3) {
      this.logger.warn('Tournament seed skipped: required players are missing');
      return;
    }

    const tournamentsData: Array<{
      name: string;
      description: string;
      startDate: Date;
      endDate: Date;
      maxParticipants: number;
      status: TournamentStatus;
      participants: User[];
    }> = [
      {
        name: 'Winter Clash 2025',
        description: 'Tournoi termine avec bracket principal et finale',
        startDate: new Date('2025-12-10'),
        endDate: new Date('2025-12-20'),
        maxParticipants: 16,
        status: TournamentStatus.COMPLETED,
        participants: [player1, player2, player3],
      },
      {
        name: 'Spring Battle 2026',
        description: 'Tournoi en cours de saison',
        startDate: new Date('2026-04-10'),
        endDate: new Date('2026-05-01'),
        maxParticipants: 32,
        status: TournamentStatus.ONGOING,
        participants: [player1, player2],
      },
      {
        name: 'Summer Cup 2026',
        description: 'Tournoi a venir',
        startDate: new Date('2026-07-01'),
        endDate: new Date('2026-07-15'),
        maxParticipants: 32,
        status: TournamentStatus.UPCOMING,
        participants: [],
      },
    ];

    for (const tournamentData of tournamentsData) {
      const existingTournament = await this.tournamentsRepository.findOne({
        where: { name: tournamentData.name },
      });

      if (existingTournament) {
        this.logger.log(`${tournamentData.name} already exists`);
        continue;
      }

      const tournament = this.tournamentsRepository.create(tournamentData);
      await this.tournamentsRepository.save(tournament);
      this.logger.log(`${tournamentData.name} created`);
    }
  }

  private async createMatchesIfMissing() {
    const player1 = await this.usersService.findByEmail('player1@battle.com');
    const player2 = await this.usersService.findByEmail('player2@battle.com');
    const player3 = await this.usersService.findByEmail('player3@battle.com');

    if (!player1 || !player2 || !player3) {
      this.logger.warn('Match seed skipped: required players are missing');
      return;
    }

    const winterClash = await this.tournamentsRepository.findOne({
      where: { name: 'Winter Clash 2025' },
    });

    const springBattle = await this.tournamentsRepository.findOne({
      where: { name: 'Spring Battle 2026' },
    });

    const matchesData: Array<{
      tournament: Tournament | null;
      playerOne: User;
      playerTwo: User;
      winner: User | null;
      score: string | null;
      playedAt: Date;
      status: MatchStatus;
    }> = [
      {
        tournament: winterClash ?? null,
        playerOne: player1,
        playerTwo: player2,
        winner: player1,
        score: '2-1',
        playedAt: new Date('2025-12-12T19:00:00.000Z'),
        status: MatchStatus.FINISHED,
      },
      {
        tournament: winterClash ?? null,
        playerOne: player2,
        playerTwo: player3,
        winner: player3,
        score: '2-0',
        playedAt: new Date('2025-12-13T19:00:00.000Z'),
        status: MatchStatus.FINISHED,
      },
      {
        tournament: winterClash ?? null,
        playerOne: player1,
        playerTwo: player3,
        winner: player1,
        score: '3-2',
        playedAt: new Date('2025-12-20T20:30:00.000Z'),
        status: MatchStatus.FINISHED,
      },
      {
        tournament: springBattle ?? null,
        playerOne: player1,
        playerTwo: player2,
        winner: player2,
        score: '1-2',
        playedAt: new Date('2026-04-15T20:00:00.000Z'),
        status: MatchStatus.FINISHED,
      },
      {
        tournament: springBattle ?? null,
        playerOne: player3,
        playerTwo: player1,
        winner: null,
        score: null,
        playedAt: new Date('2026-04-22T20:00:00.000Z'),
        status: MatchStatus.SCHEDULED,
      },
      {
        tournament: null,
        playerOne: player2,
        playerTwo: player3,
        winner: player2,
        score: '2-0',
        playedAt: new Date('2026-03-08T18:30:00.000Z'),
        status: MatchStatus.FINISHED,
      },
    ];

    for (const matchData of matchesData) {
      const existingMatch = await this.matchesRepository.findOne({
        where: {
          playedAt: matchData.playedAt,
          playerOne: { id: matchData.playerOne.id },
          playerTwo: { id: matchData.playerTwo.id },
        },
      });

      if (existingMatch) {
        this.logger.log(
          `Match ${matchData.playerOne.username} vs ${matchData.playerTwo.username} already exists`,
        );
        continue;
      }

      const match = this.matchesRepository.create(matchData);
      await this.matchesRepository.save(match);

      this.logger.log(
        `Match created: ${matchData.playerOne.username} vs ${matchData.playerTwo.username}`,
      );
    }
  }
}
