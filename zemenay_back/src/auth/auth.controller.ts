import { Controller, Post, Body, UseGuards, Req, Get, HttpException, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

interface LoginDto {
  email: string;
  password: string;
}

interface RegisterDto {
  email: string;
  password: string;
  name: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'User successfully logged in.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 409, description: 'Email already in use.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  async register(@Body() registerDto: RegisterDto) {
    try {
      console.log('Register request received:', { email: registerDto.email });
      const user = await this.authService.register(registerDto);
      return {
        statusCode: 201,
        message: 'User registered successfully',
        user
      };
    } catch (error) {
      console.error('Registration controller error:', error);
      
      if (error.message.includes('already exists') || error.message.includes('already in use')) {
        throw new HttpException(
          { statusCode: 409, message: 'Email already in use' },
          HttpStatus.CONFLICT
        );
      }
      
      throw new HttpException(
        { 
          statusCode: 500, 
          message: 'Registration failed',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: Request) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'User successfully logged out.' })
  async logout(@Req() req: Request) {
    // In a real implementation, you might want to blacklist the token
    // For now, we'll just return a success message
    return { message: 'Successfully logged out' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin')
  getAdminData() {
    return { message: 'Admin data' };
  }
}
