import { Injectable, NotFoundException, Logger, ConflictException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface User {
  id?: string;
  email: string;
  name: string;
  password?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable()
export class UsersService {
  private readonly table = 'users';
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly db: DatabaseService) {}

  async create(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    try {
      this.logger.log(`Creating user with email: ${user.email}`);
      
      // Validate required fields
      if (!user.email || !user.name) {
        throw new BadRequestException('Email and name are required');
      }

      // Check if user already exists
      const existingUser = await this.findByEmail(user.email);
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      const newUser = {
        ...user,
        email: user.email.toLowerCase().trim(),
        role: user.role || 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = await this.db.create<User>(this.table, newUser);
      
      this.logger.log(`User created successfully: ${result.id}`);
      return result;
      
    } catch (error) {
      this.logger.error('Error creating user:', error);
      throw error;
    }
  }

  async findAll(): Promise<User[]> {
    try {
      const { data, error } = await this.db.query<User>(this.table);
      if (error) throw error;
      return data || [];
    } catch (error) {
      this.logger.error('Error finding all users:', error);
      throw new Error('Failed to retrieve users');
    }
  }

  async findOne(id: string): Promise<User> {
    try {
      const user = await this.db.findById<User>(this.table, id);
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      return user;
    } catch (error) {
      this.logger.error(`Error finding user with ID ${id}:`, error);
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const { data, error } = await this.db.query<User>(
        this.table,
        '*',
        { email: email.toLowerCase().trim() }
      );
      
      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      this.logger.error(`Error finding user by email ${email}:`, error);
      throw error;
    }
  }

  async update(id: string, updates: Partial<Omit<User, 'id' | 'created_at'>>): Promise<User> {
    try {
      this.logger.log(`Updating user with ID: ${id}`);
      
      // Check if user exists
      const existingUser = await this.findOne(id);
      if (!existingUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      // If email is being updated, check for duplicates
      if (updates.email && updates.email !== existingUser.email) {
        const userWithEmail = await this.findByEmail(updates.email);
        if (userWithEmail) {
          throw new ConflictException('Email already in use');
        }
      }

      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      if (updateData.email) {
        updateData.email = updateData.email.toLowerCase().trim();
      }

      const updatedUser = await this.db.update<User>(this.table, id, updateData);
      this.logger.log(`User updated successfully: ${id}`);
      return updatedUser;
      
    } catch (error) {
      this.logger.error(`Error updating user with ID ${id}:`, error);
      throw error;
    }
  }

  async remove(id: string): Promise<boolean> {
    try {
      this.logger.log(`Deleting user with ID: ${id}`);
      
      // Check if user exists
      const existingUser = await this.findOne(id);
      if (!existingUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      await this.db.delete(this.table, id);
      this.logger.log(`User deleted successfully: ${id}`);
      return true;
      
    } catch (error) {
      this.logger.error(`Error deleting user with ID ${id}:`, error);
      throw error;
    }
  }

  // Helper method to get the Supabase client directly if needed
  getSupabaseClient() {
    return this.db.getClient();
  }
}
