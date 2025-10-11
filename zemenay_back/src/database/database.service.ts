import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient, QueryResult } from 'pg';

type ClientType = 'default' | 'admin';

// PostgreSQL Query Builder that mimics Supabase API
class PostgresQueryBuilder {
  public tableName: string;
  public selectFields: string = '*';
  public whereConditions: string[] = [];
  public whereValues: any[] = [];
  public orderByClause: string = '';
  public limitValue: number | null = null;
  public offsetValue: number | null = null;
  public isSingle: boolean = false;
  public paramCounter: number = 1;

  constructor(
    public pool: Pool,
    public table: string,
    public logger: Logger,
  ) {
    this.tableName = table;
  }
  // ... rest of the class

  select(fields: string = '*'): this {
    this.selectFields = fields;
    return this;
  }

  eq(column: string, value: any): this {
    this.whereConditions.push(`${column} = $${this.paramCounter}`);
    this.whereValues.push(value);
    this.paramCounter++;
    return this;
  }

  gte(column: string, value: any): this {
    this.whereConditions.push(`${column} >= $${this.paramCounter}`);
    this.whereValues.push(value);
    this.paramCounter++;
    return this;
  }

  neq(column: string, value: any): this {
    this.whereConditions.push(`${column} != $${this.paramCounter}`);
    this.whereValues.push(value);
    this.paramCounter++;
    return this;
  }

  in(column: string, values: any[]): this {
    const placeholders = values.map((_, idx) => `$${this.paramCounter + idx}`).join(', ');
    this.whereConditions.push(`${column} IN (${placeholders})`);
    this.whereValues.push(...values);
    this.paramCounter += values.length;
    return this;
  }

  is(column: string, value: null): this {
    this.whereConditions.push(`${column} IS NULL`);
    return this;
  }

  or(condition: string): this {
    // Simple OR implementation - parse the condition
    // Format: "column1.eq.value1,column2.eq.value2"
    const orConditions = condition.split(',').map(cond => {
      if (cond.includes('.ilike.')) {
        const [col, , val] = cond.split('.');
        this.whereValues.push(val);
        return `${col} ILIKE $${this.paramCounter++}`;
      }
      return cond;
    });
    this.whereConditions.push(`(${orConditions.join(' OR ')})`);
    return this;
  }

  order(column: string, options: { ascending?: boolean } = {}): this {
    const direction = options.ascending === false ? 'DESC' : 'ASC';
    this.orderByClause = `ORDER BY ${column} ${direction}`;
    return this;
  }

  limit(count: number): this {
    this.limitValue = count;
    return this;
  }

  range(from: number, to: number): this {
    this.offsetValue = from;
    this.limitValue = to - from + 1;
    return this;
  }

  single(): this {
    this.isSingle = true;
    this.limitValue = 1;
    return this;
  }

  maybeSingle(): this {
    this.isSingle = true;
    this.limitValue = 1;
    return this;
  }

    // Mutation methods
    insert(data: any): PostgresMutationBuilder {
      return new PostgresMutationBuilder(this.pool, this.tableName, 'insert', data, this.logger);
    }
  
    update(data: any): PostgresMutationBuilder {
      // Transfer where conditions to the mutation builder
      const mutationData = { ...data, _where: null, _match: null };
      if (this.whereConditions.length > 0) {
        // Simple case: if there's an eq condition on 'id', use it
        const idConditionIndex = this.whereConditions.findIndex(c => c.includes('id ='));
        if (idConditionIndex >= 0) {
          mutationData._where = { column: 'id', value: this.whereValues[idConditionIndex] };
        }
      }
      return new PostgresMutationBuilder(this.pool, this.tableName, 'update', mutationData, this.logger);
    }
  
    delete(): PostgresMutationBuilder {
      // Transfer where conditions to the mutation builder
      const mutationData: any = { _where: null, _match: null };
      if (this.whereConditions.length > 0) {
        // Simple case: if there's an eq condition, use it
        if (this.whereConditions.length === 1 && this.whereConditions[0].includes('=')) {
          const column = this.whereConditions[0].split('=')[0].trim().split(' ')[0];
          mutationData._where = { column, value: this.whereValues[0] };
        }
      }
      return new PostgresMutationBuilder(this.pool, this.tableName, 'delete', mutationData, this.logger);
    }

  async execute(): Promise<{ data: any; error: any; status?: number; count?: number }> {
    try {
      let query = `SELECT ${this.selectFields} FROM ${this.tableName}`;
      
      if (this.whereConditions.length > 0) {
        query += ` WHERE ${this.whereConditions.join(' AND ')}`;
      }
      
      if (this.orderByClause) {
        query += ` ${this.orderByClause}`;
      }
      
      if (this.limitValue !== null) {
        query += ` LIMIT ${this.limitValue}`;
      }
      
      if (this.offsetValue !== null) {
        query += ` OFFSET ${this.offsetValue}`;
      }

      this.logger.debug(`Executing query: ${query}`, this.whereValues);
      
      const result: QueryResult = await this.pool.query(query, this.whereValues);
      
      if (this.isSingle) {
        if (result.rows.length === 0) {
          return { data: null, error: { code: 'PGRST116', message: 'No rows found' } };
        }
        return { data: result.rows[0], error: null };
      }
      
      return { data: result.rows, error: null, count: result.rowCount ?? undefined };
    } catch (error) {
      this.logger.error(`Query error:`, error);
      return { data: null, error: { message: error.message, code: error.code } };
    }
  }

  // Make the builder thenable so it can be awaited
  then(resolve: any, reject: any) {
    return this.execute().then(resolve, reject);
  }
}

// Insert/Update/Delete Builder
class PostgresMutationBuilder {
  public returnFields: string = '*';
  public isSingle: boolean = false;

  constructor(
    public pool: Pool,
    public table: string,
    public operation: 'insert' | 'update' | 'delete',
    public data: any,
    public logger: Logger,
  ) {}

  select(fields: string = '*'): this {
    this.returnFields = fields;
    return this;
  }

  eq(column: string, value: any): this {
    this.data._where = { column, value };
    return this;
  }

  match(conditions: Record<string, any>): this {
    this.data._match = conditions;
    return this;
  }

  single(): this {
    this.isSingle = true;
    return this;
  }

  async execute(): Promise<{ data: any; error: any }> {
    try {
      let query: string;
      let values: any[];
      let result: QueryResult;

      switch (this.operation) {
        case 'insert':
          const keys = Object.keys(this.data);
          const placeholders = keys.map((_, idx) => `$${idx + 1}`).join(', ');
          values = keys.map(key => this.data[key]);
          query = `INSERT INTO ${this.table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING ${this.returnFields}`;
          result = await this.pool.query(query, values);
          break;

        case 'update':
          const updateKeys = Object.keys(this.data).filter(k => !k.startsWith('_'));
          const setClause = updateKeys.map((key, idx) => `${key} = $${idx + 1}`).join(', ');
          values = updateKeys.map(key => this.data[key]);
          
          let whereClause = '';
          if (this.data._where) {
            whereClause = `WHERE ${this.data._where.column} = $${values.length + 1}`;
            values.push(this.data._where.value);
          } else if (this.data._match) {
            const matchKeys = Object.keys(this.data._match);
            whereClause = `WHERE ${matchKeys.map((key, idx) => `${key} = $${values.length + idx + 1}`).join(' AND ')}`;
            values.push(...matchKeys.map(key => this.data._match[key]));
          }
          
          query = `UPDATE ${this.table} SET ${setClause} ${whereClause} RETURNING ${this.returnFields}`;
          result = await this.pool.query(query, values);
          break;

        case 'delete':
          let deleteWhere = '';
          values = [];
          if (this.data._where) {
            deleteWhere = `WHERE ${this.data._where.column} = $1`;
            values = [this.data._where.value];
          } else if (this.data._match) {
            const matchKeys = Object.keys(this.data._match);
            deleteWhere = `WHERE ${matchKeys.map((key, idx) => `${key} = $${idx + 1}`).join(' AND ')}`;
            values = matchKeys.map(key => this.data._match[key]);
          }
          query = `DELETE FROM ${this.table} ${deleteWhere}`;
          result = await this.pool.query(query, values);
          break;
      }

      this.logger.debug(`Mutation query: ${query}`, values);

      if (this.isSingle) {
        return { data: result.rows[0] || null, error: null };
      }
      
      return { data: result.rows, error: null };
    } catch (error) {
      this.logger.error(`Mutation error:`, error);
      return { data: null, error: { message: error.message, code: error.code } };
    }
  }

  then(resolve: any, reject: any) {
    return this.execute().then(resolve, reject);
  }
}

// RPC Builder
// RPC Builder
class PostgresRpcBuilder {
  constructor(
    public pool: Pool,
    public functionName: string,
    public params: any,
    public logger: Logger,
  ) {}

  async execute(): Promise<{ data: any; error: any }> {
    try {
      const query = `SELECT * FROM ${this.functionName}($1)`;
      this.logger.debug(`RPC query: ${query}`, [this.params]);
      const result = await this.pool.query(query, [this.params]);
      return { data: result.rows, error: null };
    } catch (error) {
      this.logger.error(`RPC error:`, error);
      return { data: null, error: { message: error.message, code: error.code } };
    }
  }

  then(resolve: any, reject: any) {
    return this.execute().then(resolve, reject);
  }
}

// Main PostgreSQL Client Wrapper
class PostgresClientWrapper {
  constructor(
    public pool: Pool,
    public logger: Logger,
  ) {}

  from(table: string): PostgresQueryBuilder {
    return new PostgresQueryBuilder(this.pool, table, this.logger);
  }

  rpc(functionName: string, params: any = {}): PostgresRpcBuilder {
    return new PostgresRpcBuilder(this.pool, functionName, params, this.logger);
  }
}

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool;
  private client: PostgresClientWrapper;
  private adminClient: PostgresClientWrapper;

  constructor(private configService: ConfigService) {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');

    if (!databaseUrl) {
      throw new Error('Missing DATABASE_URL configuration');
    }

    this.pool = new Pool({
      connectionString: databaseUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.client = new PostgresClientWrapper(this.pool, this.logger);
    this.adminClient = this.client; // Same pool for both in local setup
  }

  async onModuleInit() {
    try {
      this.logger.log('Initializing PostgreSQL database connection...');
      
      const databaseUrl = this.configService.get<string>('DATABASE_URL');
      if (!databaseUrl) {
        throw new Error('Missing DATABASE_URL. Please check your .env file');
      }
      
      this.logger.log(`Connecting to PostgreSQL database...`);
      
      // Test connection
      const client = await this.pool.connect();
      try {
        const result = await client.query('SELECT NOW()');
        this.logger.log('Successfully connected to PostgreSQL database');
        this.logger.log(`Database time: ${result.rows[0].now}`);
        
        // Test posts table
        const testQuery = await client.query('SELECT COUNT(*) FROM posts');
        this.logger.log(`Posts table accessible. Count: ${testQuery.rows[0].count}`);
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error('Critical database initialization error:', error);
      throw new Error(`Failed to initialize database connection: ${error.message}`);
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
    this.logger.log('PostgreSQL connection pool closed');
  }

  // Get the PostgreSQL client wrapper (mimics Supabase client)
  getClient(type: ClientType = 'default'): PostgresClientWrapper {
    return type === 'admin' ? this.adminClient : this.client;
  }

  getAdminClient(): PostgresClientWrapper {
    return this.adminClient;
  }

  getRegularClient(): PostgresClientWrapper {
    return this.client;
  }

  async query<T = any>(
    table: string,
    select: string = '*',
    filters: Record<string, any> = {},
    type: ClientType = 'default',
  ): Promise<{ data: T[] | null; error: any }> {
    try {
      let queryBuilder = this.getClient(type).from(table).select(select);
  
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            queryBuilder = queryBuilder.in(key, value);
          } else {
            queryBuilder = queryBuilder.eq(key, value);
          }
        }
      });
  
      const result = await queryBuilder.execute();  // FIX: Call execute explicitly
      
      return { 
        data: result.data as unknown as T[], 
        error: result.error || null 
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
  async create<T = any>(table: string, data: any, type: ClientType = 'default'): Promise<T> {
    try {
      const builder = new PostgresMutationBuilder(this.pool, table, 'insert', data, this.logger);
      const response = await builder.select().single().execute();  // FIX: Call execute explicitly
      const { data: result, error } = response;
  
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
      const builder = new PostgresMutationBuilder(
        this.pool,
        table,
        'update',
        { ...updates, _where: { column: 'id', value: id } },
        this.logger,
      );
      const response = await builder.select().single().execute();  // FIX: Call execute explicitly
      const { data, error } = response;
  
      if (error) throw error;
      return data as T;
    } catch (error) {
      this.logger.error(`Error updating ${table} with id ${id}:`, error);
      throw error;
    }
  }

  async delete(table: string, id: string, type: ClientType = 'default'): Promise<boolean> {
    try {
      const builder = new PostgresMutationBuilder(
        this.pool,
        table,
        'delete',
        { _where: { column: 'id', value: id } },
        this.logger,
      );
      const response = await builder.execute();  // FIX: Call execute explicitly
      const { error } = response;
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
      const result = await this.getClient(type)
        .from(table)
        .select('*')
        .eq('id', id)
        .single()
        .execute();  // FIX: Call execute explicitly
  
      const { data, error } = result;
      if (error) throw error;
      return data as T;
    } catch (error) {
      this.logger.error(`Error finding ${table} by id ${id}:`, error);
      return null;
    }
  }
}