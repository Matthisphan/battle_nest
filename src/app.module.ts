import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module';
import { Game } from './games/entities/game.entity';
import { GamesModule } from './games/games.module';
import { Match } from './matches/entities/match.entity';
import { MatchesModule } from './matches/matches.module';
import { DatabaseSeed } from './seeds/database.seed';
import { Tournament } from './tournaments/entities/tournament.entity';
import { TournamentsModule } from './tournaments/tournaments.module';
import { User } from './users/entities/user.entity';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 10,
      },
    ]),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: Number(configService.get<string>('DB_PORT')),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [User, Game, Tournament, Match],
        synchronize: true,
      }),
    }),

    TypeOrmModule.forFeature([Game, Tournament, Match]),

    UsersModule,
    AuthModule,
    GamesModule,
    TournamentsModule,
    MatchesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    DatabaseSeed,
  ],
})
export class AppModule {}
