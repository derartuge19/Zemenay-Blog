import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CategoriesService {
  private readonly table = 'categories';
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private readonly db: DatabaseService) {}

  private getClient() {
    // Use admin client to bypass RLS for category operations
    return this.db.getClient('admin');
  }

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    try {
      const slug = createCategoryDto.name.toLowerCase().replace(/\s+/g, '-');
      const now = new Date().toISOString();
      
      const categoryData = {
        id: uuidv4(),
        ...createCategoryDto,
        slug,
        created_at: now,
        updated_at: now,
      };

      const { data: category, error } = await this.getClient()
        .from(this.table)
        .insert(categoryData)
        .select()
        .single();

      if (error) {
        this.logger.error('Error creating category:', error);
        throw new Error(`Failed to create category: ${error.message}`);
      }

      return category as Category;
    } catch (error) {
      this.logger.error('Error in create category:', error);
      throw error;
    }
  }

  async findAll(): Promise<Category[]> {
    try {
      const { data: categories, error } = await this.getClient()
        .from(this.table)
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch categories: ${error.message}`);
      }

      return categories as Category[];
    } catch (error) {
      this.logger.error('Error in findAll categories:', error);
      throw error;
    }
  }

  async findOne(id: string): Promise<Category> {
    try {
      const { data: category, error } = await this.getClient()
        .from(this.table)
        .select('*')
        .eq('id', id)
        .single();

      if (error || !category) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }

      return category as Category;
    } catch (error) {
      this.logger.error(`Error finding category ${id}:`, error);
      throw error;
    }
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    try {
      // Check if category exists
      await this.findOne(id);
      
      const updateData: any = { ...updateCategoryDto, updated_at: new Date().toISOString() };
      
      // If name is being updated, update the slug as well
      if (updateCategoryDto.name) {
        updateData.slug = updateCategoryDto.name.toLowerCase().replace(/\s+/g, '-');
      }

      const { data: updatedCategory, error } = await this.getClient()
        .from(this.table)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update category: ${error.message}`);
      }

      return updatedCategory as Category;
    } catch (error) {
      this.logger.error(`Error updating category ${id}:`, error);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      // Check if category exists
      await this.findOne(id);

      const { error } = await this.getClient()
        .from(this.table)
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete category: ${error.message}`);
      }
    } catch (error) {
      this.logger.error(`Error deleting category ${id}:`, error);
      throw error;
    }
  }
}
