import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

interface LoginDto {
  email: string;
  password: string;
}

interface RegisterDto {
  email: string;
  password: string;
  name: string;
}

interface UserPayload {
  id: string;
  email: string;
  name?: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<Omit<UserPayload, 'password'> | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && 'password' in user && await bcrypt.compare(pass, user.password as string)) {
      const { password, ...result } = user as UserPayload & { password: string };
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { 
      email: user.email, 
      sub: user.id,
      role: user.role 
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    try {
      console.log('Starting registration for:', registerDto.email);
      
      // Check if user already exists
      const existingUser = await this.usersService.findByEmail(registerDto.email);
      if (existingUser) {
        console.log('Registration failed - User already exists:', registerDto.email);
        throw new Error('User with this email already exists');
      }

      console.log('Hashing password...');
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);
      
      console.log('Creating user in database...');
      const user = await this.usersService.create({
        ...registerDto,
        password: hashedPassword,
        role: 'user', // Default role
      });
      
      console.log('User created successfully:', user.id);
      
      // Remove password before returning
      const { password, ...result } = user as any;
      return result;
      
    } catch (error) {
      console.error('Registration error:', error);
      if (error.code === '23505') { // Unique violation
        throw new Error('Email already in use');
      }
      throw new Error(`Registration failed: ${error.message}`);
    }
  }
}
