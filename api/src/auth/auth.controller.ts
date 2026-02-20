import { Controller, Post, UseGuards, Get, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/role.enum';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LocalAuthGuard } from './local-auth.guard';

interface RequestWithUser extends Request {
  user;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'Login com email e senha' })
  async login(@Req() req: RequestWithUser) {
    return this.authService.login(req.user);
  }

  @Get('seed')
  @ApiOperation({ summary: 'Cria o usuário Admin inicial' })
  async seed() {
    const existing = await this.usersService.findOneByEmail('admin@admin.com');
    if (existing) {
      return { message: 'Admin já existe!' };
    }

    return this.usersService.create({
      name: 'Administrador Supremo',
      email: 'admin@admin.com',
      password: '123456',
      role: UserRole.ADMIN,
    });
  }
}
