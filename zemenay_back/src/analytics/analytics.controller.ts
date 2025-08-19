import { Controller, Get, UseGuards, Request, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns dashboard statistics',
    schema: {
      type: 'object',
      properties: {
        totalPosts: { type: 'number' },
        totalUsers: { type: 'number' },
        totalViews: { type: 'number' },
        averageViews: { type: 'number' },
        popularPosts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              slug: { type: 'string' },
              view_count: { type: 'number' }
            }
          }
        },
        recentPosts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              slug: { type: 'string' },
              created_at: { type: 'string' },
              view_count: { type: 'number' }
            }
          }
        },
        postsByStatus: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              count: { type: 'number' },
              views: { type: 'number' },
              avgViews: { type: 'number' }
            }
          }
        },
        monthlyStats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              month: { type: 'string' },
              count: { type: 'number' },
              views: { type: 'number' },
              avgViews: { type: 'number' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getDashboardStats(@Request() req: any) {
    try {
      return await this.analyticsService.getDashboardStats();
    } catch (error) {
      this.logger.error('Error in getDashboardStats:', error);
      throw new HttpException(
        'Failed to fetch dashboard statistics',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
