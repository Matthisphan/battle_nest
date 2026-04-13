import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { UserRole } from '../auth/enums/user-role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { UsersService } from './users.service';

type RequestWithUser = Request & {
  user?: {
    id: string;
    role: UserRole;
  };
};

@ApiTags('Players')
@Controller('players')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyProfile(@Req() req: RequestWithUser) {
    const user = await this.usersService.findByIdOrFail(req.user!.id);

    return this.usersService.toPrivateProfile(user);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  async getPlayers(@Req() req: RequestWithUser) {
    const users =
      req.user?.role === UserRole.ADMIN
        ? await this.usersService.findAllUsers()
        : await this.usersService.findAllPlayers();

    return users.map((user) =>
      req.user?.role === UserRole.ADMIN
        ? this.usersService.toPrivateProfile(user)
        : this.usersService.toPublicProfile(user),
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  async getPlayerById(@Param('id') id: string, @Req() req: RequestWithUser) {
    const user =
      req.user?.role === UserRole.ADMIN
        ? await this.usersService.findByIdOrFail(id)
        : await this.usersService.findPublicByIdOrFail(id);

    return req.user?.role === UserRole.ADMIN
      ? this.usersService.toPrivateProfile(user)
      : this.usersService.toPublicProfile(user);
  }
}
