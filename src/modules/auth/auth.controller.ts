import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  Version,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthUser } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';

type AuthRequest = Request & { user: AuthUser };

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @Version('1')
  register(@Body() dto: RegisterDto, @Req() request: Request) {
    return this.auth.register(dto, this.metadata(request));
  }

  @Post('login')
  @Version('1')
  login(@Body() dto: LoginDto, @Req() request: Request) {
    return this.auth.login(dto, this.metadata(request));
  }

  @Post('refresh')
  @Version('1')
  refresh(@Body() dto: RefreshDto, @Req() request: Request) {
    return this.auth.refresh(dto.refreshToken, this.metadata(request));
  }

  @Post('logout')
  @Version('1')
  logout(@Body() dto: RefreshDto) {
    return this.auth.logout(dto.refreshToken);
  }

  @Get('me')
  @Version('1')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  me(@Req() request: AuthRequest) {
    return this.auth.getProfile(request.user.userId);
  }

  private metadata(request: Request) {
    return {
      userAgent: request.get('user-agent')?.slice(0, 500),
      ipAddress: request.ip,
    };
  }
}
