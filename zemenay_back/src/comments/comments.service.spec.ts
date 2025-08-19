import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommentsService } from './comments.service';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { NotFoundException } from '@nestjs/common';

describe('CommentsService', () => {
  let service: CommentsService;
  let commentsRepository: Repository<Comment>;

  const mockComment = {
    id: '1',
    content: 'Test comment',
    post_id: 'post-1',
    user_id: 'user-1',
    author_name: 'Test User',
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        {
          provide: getRepositoryToken(Comment),
          useValue: {
            create: jest.fn().mockImplementation(dto => dto),
            save: jest.fn().mockImplementation(comment => Promise.resolve({ ...comment, id: '1' })),
            find: jest.fn().mockResolvedValue([mockComment]),
            findOne: jest.fn().mockResolvedValue(mockComment),
            delete: jest.fn().mockResolvedValue({ affected: 1 }),
            count: jest.fn().mockResolvedValue(1),
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([mockComment]),
            })),
          },
        },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
    commentsRepository = module.get<Repository<Comment>>(getRepositoryToken(Comment));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a comment', async () => {
      const createCommentDto: CreateCommentDto = {
        content: 'Test comment',
        post_id: 'post-1',
        author_name: 'Test User',
        author_email: 'test@example.com',
      };

      const result = await service.create(createCommentDto);
      expect(result).toEqual({
        ...createCommentDto,
        status: 'pending',
      });
      expect(commentsRepository.create).toHaveBeenCalledWith({
        ...createCommentDto,
        status: 'pending',
      });
      expect(commentsRepository.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return an array of comments', async () => {
      const result = await service.findAll('post-1');
      expect(result).toEqual([mockComment]);
      expect(commentsRepository.createQueryBuilder).toHaveBeenCalled();
    });

    it('should filter by status', async () => {
      await service.findAll('post-1', 'approved');
      expect(commentsRepository.createQueryBuilder().andWhere).toHaveBeenCalledWith(
        'comment.status = :status',
        { status: 'approved' },
      );
    });
  });

  describe('findOne', () => {
    it('should return a comment by id', async () => {
      const result = await service.findOne('1');
      expect(result).toEqual(mockComment);
      expect(commentsRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('should throw NotFoundException if comment not found', async () => {
      jest.spyOn(commentsRepository, 'findOne').mockResolvedValueOnce(undefined);
      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a comment', async () => {
      const updateData = { content: 'Updated comment' };
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(mockComment);
      
      const result = await service.update('1', updateData);
      expect(result).toEqual({
        ...mockComment,
        ...updateData,
      });
      expect(commentsRepository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a comment', async () => {
      await service.remove('1');
      expect(commentsRepository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if comment not found', async () => {
      jest.spyOn(commentsRepository, 'delete').mockResolvedValueOnce({ affected: 0 } as any);
      await expect(service.remove('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCommentsCount', () => {
    it('should return the count of approved comments for a post', async () => {
      const result = await service.getCommentsCount('post-1');
      expect(result).toBe(1);
      expect(commentsRepository.count).toHaveBeenCalledWith({
        where: { post_id: 'post-1', status: 'approved' },
      });
    });
  });
});
