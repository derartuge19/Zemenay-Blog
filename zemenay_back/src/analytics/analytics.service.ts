import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

interface PostWithViewCount {
  view_count?: number;
  status?: string;
  created_at?: string;
  title?: string;
  slug?: string;
  id?: number;
  [key: string]: any; // For any additional properties
}

interface MonthlyStats {
  month: string;
  count: number;
  views: number;
  avgViews: number;
}

interface PostsByStatus {
  status: string;
  count: number;
  views: number;
  avgViews: number;
}

interface DashboardStats {
  totalPosts: number;
  totalUsers: number;
  totalViews: number;
  averageViews: number;
  popularPosts: PostWithViewCount[];
  recentPosts: PostWithViewCount[];
  postsByStatus: PostsByStatus[];
  monthlyStats: MonthlyStats[];
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly db: DatabaseService) {}

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Get total posts count
      const { count: totalPosts } = await this.db.getClient()
        .from('posts')
        .select('*', { count: 'exact', head: true });

      // Get total users count
      const { count: totalUsers } = await this.db.getClient()
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Get most viewed posts
      const { data: popularPosts } = await this.db.getClient()
        .from('posts')
        .select('id, title, slug, view_count')
        .order('view_count', { ascending: false })
        .limit(5);

      // Get recent posts
      const { data: recentPosts } = await this.db.getClient()
        .from('posts')
        .select('id, title, slug, created_at, view_count')
        .order('created_at', { ascending: false })
        .limit(5);

      // Get total views across all posts
      const { data: posts } = await this.db.getClient()
        .from('posts')
        .select('view_count');
      
      const totalViews = posts?.reduce((sum: number, post: PostWithViewCount) => 
        sum + (post.view_count || 0), 0) || 0;
      const averageViews = totalPosts ? Math.round((totalViews / totalPosts) * 10) / 10 : 0;

      // Get posts by status with view counts
      const { data: allPosts } = await this.db.getClient()
        .from('posts')
        .select('status, view_count');
      
      // Initialize status counts
      const statusCounts: Record<string, { count: number; views: number }> = {};
      
      // Count posts and sum views by status
      allPosts?.forEach((post: PostWithViewCount) => {
        if (post?.status) {
          if (!statusCounts[post.status]) {
            statusCounts[post.status] = { count: 0, views: 0 };
          }
          statusCounts[post.status].count += 1;
          statusCounts[post.status].views += post.view_count || 0;
        }
      });
      
      // Convert to array of { status, count, views } objects
      const postsByStatus = Object.entries(statusCounts).map(([status, data]) => ({
        status,
        count: data.count,
        views: data.views,
        avgViews: data.count > 0 ? Math.round((data.views / data.count) * 10) / 10 : 0
      }));

      // Get posts by month for the last 6 months with view counts
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: postsByMonth } = await this.db.getClient()
        .from('posts')
        .select('created_at, view_count')
        .gte('created_at', sixMonthsAgo.toISOString());

      // Process monthly stats with view counts
      const monthlyStats = this.processMonthlyStats(postsByMonth || []);

      return {
        totalPosts: totalPosts || 0,
        totalUsers: totalUsers || 0,
        totalViews,
        averageViews,
        popularPosts: popularPosts || [],
        recentPosts: recentPosts || [],
        postsByStatus: postsByStatus || [],
        monthlyStats,
      };
    } catch (error) {
      this.logger.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  private processMonthlyStats(posts: PostWithViewCount[]): MonthlyStats[] {
    const months: Record<string, { count: number; views: number }> = {};
    const now = new Date();
    
    // Initialize last 6 months with 0 counts and views
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      months[monthYear] = { count: 0, views: 0 };
    }

    // Count posts and sum views per month
    posts.forEach(post => {
      // Skip if created_at is undefined or null
      if (!post.created_at) return;
      
      const date = new Date(post.created_at);
      const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });

      if (months[monthYear]) {
        months[monthYear].count++;
        months[monthYear].views += post.view_count || 0;
      } else {
        months[monthYear] = {
          count: 1,
          views: post.view_count || 0,
        };
      }
    });

    // Convert to array format for charts
    return Object.entries(months).map(([month, data]) => ({
      month,
      count: data.count,
      views: data.views,
      avgViews: data.count > 0 ? Math.round((data.views / data.count) * 10) / 10 : 0
    }));
  }
}
