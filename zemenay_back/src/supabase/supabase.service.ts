import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);

  constructor(private databaseService: DatabaseService) {
    this.logger.log('SupabaseService initialized with PostgreSQL DatabaseService');
  }

  getClient() {
    return this.databaseService.getClient();
  }

  // Example method to fetch data
  async fetchData(table: string) {
    const result = await this.getClient()
      .from(table)
      .select('*')
      .execute();
      
    const { data, error } = result;
    if (error) {
      this.logger.error(`Error fetching data from ${table}:`, error);
      throw error;
    }
    
    return data;
  }

  // Example method to insert data
  async insertData(table: string, payload: any) {
    const result = await this.getClient()
      .from(table)
      .select('*')
      .execute();
      
    const { data, error } = result;
    if (error) {
      this.logger.error(`Error inserting data into ${table}:`, error);
      throw error;
    }
    
    return data;
  }

  // Example method to update data
  async updateData(table: string, id: string, payload: any) {
    try {
      const updated = await this.databaseService.update(table, id, payload);
      return updated;
    } catch (error) {
      this.logger.error(`Error updating data in ${table}:`, error);
      throw error;
    }
  }

  // Example method to delete data
  async deleteData(table: string, id: string) {
    try {
      await this.databaseService.delete(table, id);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error deleting data from ${table}:`, error);
      throw error;
    }
  }
}