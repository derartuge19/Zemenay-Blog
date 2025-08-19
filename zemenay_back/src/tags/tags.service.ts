import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { Tag } from './entities/tag.entity';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class TagsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(createTagDto: CreateTagDto): Promise<Tag> {
    const { name } = createTagDto;
    const slug = this.generateSlug(name);
    
    const data = {
      name,
      slug,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    const result = await this.databaseService.apply<Tag>({
      table: 'tags',
      operation: 'create',
      data,
    });
    
    return result;
  }

  async findAll(): Promise<Tag[]> {
    const { data, error } = await this.databaseService.getClient()
      .from('tags')
      .select('*')
      .order('name');
    
    if (error) {
      throw new Error(`Failed to fetch tags: ${error.message}`);
    }
    
    return data || [];
  }

  async findOne(id: string): Promise<Tag> {
    const { data, error } = await this.databaseService.getClient()
      .from('tags')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      throw new Error(`Failed to fetch tag: ${error.message}`);
    }
    
    if (!data) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }
    
    return data;
  }

  async update(id: string, updateTagDto: UpdateTagDto): Promise<Tag> {
    const { name } = updateTagDto;
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    
    if (name) {
      updateData.name = name;
      updateData.slug = this.generateSlug(name);
    }
    
    const result = await this.databaseService.apply<Tag>({
      table: 'tags',
      operation: 'update',
      match: { id },
      data: updateData,
    });
    
    return result;
  }

  async remove(id: string): Promise<void> {
    await this.databaseService.apply({
      table: 'tags',
      operation: 'delete',
      match: { id },
    });
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')      // Replace spaces with hyphens
      .replace(/--+/g, '-')      // Replace multiple hyphens with single
      .trim();
  }
} 