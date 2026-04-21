import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';

import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SetUserBanDto } from './dto/set-user-ban.dto';
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
  @ApiOperation({ summary: 'Get connected user profile' })
  @ApiResponse({ status: 200, description: 'Private profile returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyProfile(@Req() req: RequestWithUser) {
    const user = await this.usersService.findByIdOrFail(req.user!.id);

    return this.usersService.toPrivateProfile(user);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('me/stats')
  @ApiOperation({ summary: 'Get connected user statistics and match history' })
  @ApiResponse({ status: 200, description: 'Stats returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMyStats(@Req() req: RequestWithUser) {
    return this.usersService.getUserStats(req.user!.id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Delete('me')
  @ApiOperation({ summary: 'Delete connected user account' })
  @ApiResponse({ status: 200, description: 'Account deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  deleteMyAccount(@Req() req: RequestWithUser) {
    return this.usersService.removeById(req.user!.id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('admin/:id/ban')
  @ApiOperation({ summary: 'Admin: ban or unban a user account' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ type: SetUserBanDto })
  @ApiResponse({ status: 200, description: 'Ban status updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden: admin only' })
  @ApiResponse({ status: 404, description: 'User not found' })
  setUserBanStatus(@Param('id') id: string, @Body() dto: SetUserBanDto) {
    return this.usersService.setBanStatus(id, dto.banned);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete('admin/:id')
  @ApiOperation({ summary: 'Admin: delete any user account' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden: admin only' })
  @ApiResponse({ status: 404, description: 'User not found' })
  deleteUserAsAdmin(@Param('id') id: string) {
    return this.usersService.removeById(id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'List players (admin sees private profiles)' })
  @ApiResponse({ status: 200, description: 'Players list returned' })
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
  @Get(':username')
  @ApiOperation({ summary: 'Get player profile by username' })
  @ApiParam({ name: 'username', description: 'Player username' })
  @ApiResponse({ status: 200, description: 'Profile returned' })
  @ApiResponse({ status: 404, description: 'Player not found' })
  async getPlayerByUsername(
    @Param('username') username: string,
    @Req() req: RequestWithUser,
  ) {
    const user =
      req.user?.role === UserRole.ADMIN
        ? await this.usersService.findByUsernameOrFail(username)
        : await this.usersService.findPublicByUsernameOrFail(username);

    return req.user?.role === UserRole.ADMIN
      ? this.usersService.toPrivateProfile(user)
      : this.usersService.toPublicProfile(user);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':username/stats')
  @ApiOperation({ summary: 'Get player statistics by username' })
  @ApiParam({ name: 'username', description: 'Player username' })
  @ApiResponse({ status: 200, description: 'Stats returned' })
  @ApiResponse({ status: 404, description: 'Player not found' })
  async getPlayerStatsByUsername(@Param('username') username: string) {
    const user = await this.usersService.findByUsernameOrFail(username);

    return this.usersService.getUserStats(user.id);
  }
}
