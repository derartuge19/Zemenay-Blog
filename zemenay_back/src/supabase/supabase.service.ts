import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    this.initializeSupabase();
  }

  private initializeSupabase() {
    try {
      const supabaseUrl = this.configService.get('NEXT_PUBLIC_SUPABASE_URL');
      const supabaseKey = this.configService.get('NEXT_PUBLIC_SUPABASE_ANON_KEY');
      
      this.logger.debug(`Supabase URL: ${supabaseUrl ? 'Found' : 'Missing'}`);
      this.logger.debug(`Supabase Key: ${supabaseKey ? 'Found' : 'Missing'}`);
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase configuration. Please check your .env file for NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
      }
      
      this.supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
        },
      });
      
      this.logger.log('Supabase client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Supabase client', error.stack);
      throw error;
    }
  }

  getClient(): SupabaseClient {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }
    return this.supabase;
  }

  // Example method to fetch data
  async fetchData(table: string) {
    const { data, error } = await this.getClient()
      .from(table)
      .select('*');
      
    if (error) {
      this.logger.error(`Error fetching data from ${table}:`, error);
      throw error;
    }
    
    return data;
  }

  // Example method to insert data
  async insertData(table: string, payload: any) {
    const { data, error } = await this.getClient()
      .from(table)
      .insert(payload)
      .select();
      
    if (error) {
      this.logger.error(`Error inserting data into ${table}:`, error);
      throw error;
    }
    
    return data;
  }

  // Example method to update data
  async updateData(table: string, id: string, payload: any) {
    const { data, error } = await this.getClient()
      .from(table)
      .update(payload)
      .eq('id', id)
      .select();
      
    if (error) {
      this.logger.error(`Error updating data in ${table}:`, error);
      throw error;
    }
    
    return data;
  }

  // Example method to delete data
  async deleteData(table: string, id: string) {
    const { error } = await this.getClient()
      .from(table)
      .delete()
      .eq('id', id);
      
    if (error) {
      this.logger.error(`Error deleting data from ${table}:`, error);
      throw error;
    }
    
    return { success: true };
  }
}
