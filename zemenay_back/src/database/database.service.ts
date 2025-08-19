import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

type ClientType = 'default' | 'admin';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);
  private supabase: SupabaseClient;
  private adminSupabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Regular client with anon key
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Admin client with service role key (bypasses RLS)
    if (supabaseServiceKey) {
      this.adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    } else {
      this.logger.warn('SUPABASE_SERVICE_KEY not found. Admin operations will use the regular client.');
      this.adminSupabase = this.supabase;
    }
  }

  async onModuleInit() {
    try {
      this.logger.log('Initializing database connection...');
      
      // Verify Supabase URL and key are set
      const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
      const supabaseKey = this.configService.get<string>('SUPABASE_KEY');
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase configuration. Please check your .env file for SUPABASE_URL and SUPABASE_KEY');
      }
      
      this.logger.log(`Connecting to Supabase at: ${supabaseUrl}`);
      
      try {
        // Simple connection test using a basic query to the posts table
        const { error: testError } = await this.supabase
          .from('posts')
          .select('id')
          .limit(1);
        
        if (testError) {
          this.logger.error('Supabase query failed:', testError);
          throw new Error(`Supabase query failed: ${testError.message}`);
        }
        
        this.logger.log('Successfully connected to Supabase and verified posts table access');
      } catch (error) {
        // Handle network-related errors
        if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
          throw new Error(`Cannot connect to Supabase at ${supabaseUrl}. Please check your internet connection and ensure the URL is correct.`);
        }
        throw error;
      }

      // Test admin client connection if different from regular client
      if (this.adminSupabase !== this.supabase) {
        try {
          const { error: adminError } = await this.adminSupabase
            .from('posts')
            .select('id')
            .limit(1);
            
          if (adminError) {
            this.logger.warn('Admin client connection test failed:', adminError);
          } else {
            this.logger.log('Successfully connected with admin client');
          }
        } catch (error) {
          this.logger.warn('Admin client connection test failed:', error);
        }
      }
    } catch (error) {
      this.logger.error('Critical database initialization error:', error);
      throw new Error(`Failed to initialize database connection: ${error.message}`);
    }
  }

  // Get the appropriate Supabase client instance
  getClient(type: ClientType = 'default'): SupabaseClient {
    return type === 'admin' ? this.adminSupabase : this.supabase;
  }

  // Get the admin client (bypasses RLS)
  getAdminClient(): SupabaseClient {
    return this.adminSupabase;
  }

  // Get the regular client (respects RLS)
  getRegularClient(): SupabaseClient {
    return this.supabase;
  }

  // Generic query method
  async query<T = any>(
    table: string,
    select: string = '*',
    filters: Record<string, any> = {},
    type: ClientType = 'default',
  ): Promise<{ data: T[] | null; error: any }> {
    try {
      let query = this.getClient(type).from(table).select(select);

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else {
            query = query.eq(key, value);
          }
        }
      });

      const { data, error } = await query;
      
      // Return typed data with error
      return { 
        data: data as unknown as T[], 
        error: error || null 
      };
      
    } catch (error) {
      this.logger.error(`Error querying ${table}:`, error);
      return { data: null, error };
    }
  }

  // Apply operation (for backward compatibility)
  async apply<T = any>({
    table,
    operation,
    data,
    match = {},
    type = 'default',
  }: {
    table: string;
    operation: 'create' | 'update' | 'delete';
    data?: any;
    match?: Record<string, any>;
    type?: ClientType;
  }): Promise<T> {
    try {
      switch (operation) {
        case 'create':
          if (!data) throw new Error('Data is required for create operation');
          return this.create(table, data, type) as unknown as T;

        case 'update':
          if (!Object.keys(match).length) {
            throw new Error('Match criteria required for update operation');
          }
          return this.update(table, match.id, data, type) as unknown as T;

        case 'delete':
          if (!Object.keys(match).length) {
            throw new Error('Match criteria required for delete operation');
          }
          return this.delete(table, match.id, type) as unknown as T;

        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }
    } catch (error) {
      this.logger.error(`Error in apply operation (${operation}):`, error);
      throw error;
    }
  }

  // Create a new record
  async create<T = any>(table: string, data: any, type: ClientType = 'default'): Promise<T> {
    try {
      const { data: result, error } = await this.getClient(type)
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result as T;
    } catch (error) {
      this.logger.error(`Error creating ${table}:`, error);
      throw error;
    }
  }

  // Update a record
  async update<T = any>(table: string, id: string, updates: any, type: ClientType = 'default'): Promise<T> {
    try {
      const { data, error } = await this.getClient(type)
        .from(table)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as T;
    } catch (error) {
      this.logger.error(`Error updating ${table} with id ${id}:`, error);
      throw error;
    }
  }

  // Delete a record
  async delete(table: string, id: string, type: ClientType = 'default'): Promise<boolean> {
    try {
      const { error } = await this.getClient(type).from(table).delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (error) {
      this.logger.error(`Error deleting ${table} with id ${id}:`, error);
      throw error;
    }
  }

  // Find by ID
  async findById<T = any>(table: string, id: string, type: ClientType = 'default'): Promise<T | null> {
    try {
      const { data, error } = await this.getClient(type)
        .from(table)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as T;
    } catch (error) {
      this.logger.error(`Error finding ${table} by id ${id}:`, error);
      return null;
    }
  }
}
