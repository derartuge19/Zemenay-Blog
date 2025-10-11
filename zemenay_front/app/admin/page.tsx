'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, Users, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';
import { getPosts } from '@/lib/blog-api';

export default function AdminDashboard() {
  const { user, signOut, isLoading } = useAuth(); // use signOut instead of logout
  const router = useRouter();
  const [stats, setStats] = useState({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    totalUsers: 1,
  });
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (user?.role?.toLowerCase() === 'admin') {
        // safe optional chaining
        try {
          const response = await getPosts();
          const allPosts = response.data || []; // Change from: Array.isArray(response) ? response : []

          const published = allPosts.filter(
            (post) => String(post?.status || '').toLowerCase() === 'published',
          );
          const drafts = allPosts.filter(
            (post) => String(post?.status || '').toLowerCase() === 'draft',
          );

          setStats({
            totalPosts: allPosts.length,
            publishedPosts: published.length,
            draftPosts: drafts.length,
            totalUsers: 1, // TODO: fetch real user count
          });

          const sortedPosts = [...allPosts].sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA;
          });

          setRecentPosts(sortedPosts.slice(0, 5));
        } catch (error) {
          console.error(error);
          setStats({
            totalPosts: 0,
            publishedPosts: 0,
            draftPosts: 0,
            totalUsers: 0,
          });
          setRecentPosts([]);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isAdmin = user?.role?.toLowerCase() === 'admin';

  return (
    <div className="min-h-screen bg-black text-white pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-green-500 mb-2">
              Dashboard Overview
            </h1>
            <p className="text-gray-400">
              Welcome back,{' '}
              <span className="text-green-400 font-medium">
                {user.name || user.email}
              </span>
            </p>
          </div>
          {signOut && (
            <Button
              onClick={signOut}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 text-sm font-medium transition-colors duration-200"
            >
              <LogOut className="inline-block w-4 h-4 mr-2" /> Logout
            </Button>
          )}
        </div>

        <main className="w-full space-y-10">
          {!isAdmin ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center max-w-md mx-auto p-8 bg-gray-900/50 rounded-xl">
                <div className="h-20 w-20 rounded-full bg-red-900/30 flex items-center justify-center mx-auto mb-6">
                  <Settings className="h-10 w-10 text-red-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">
                  Access Denied
                </h2>
                <p className="text-gray-300 mb-6 text-base">
                  You need administrator privileges to access this dashboard.
                </p>
                <Button
                  asChild
                  className="bg-green-600 hover:bg-green-700 px-6 py-2 text-sm font-medium transition-colors duration-200"
                >
                  <Link href="/">Back to Home</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-10">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">Total Posts</CardTitle>
                    <FileText className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{stats.totalPosts}</div>
                  </CardContent>
                </Card>
          
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">Published</CardTitle>
                    <FileText className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{stats.publishedPosts}</div>
                  </CardContent>
                </Card>
          
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">Drafts</CardTitle>
                    <FileText className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{stats.draftPosts}</div>
                  </CardContent>
                </Card>
          
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">Users</CardTitle>
                    <Users className="h-4 w-4 text-purple-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
                  </CardContent>
                </Card>
              </div>
          
              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link href="/admin/posts/new">
                  <Card className="bg-gradient-to-br from-green-900/30 to-green-800/20 border-green-700/50 hover:border-green-600 transition-all cursor-pointer">
                    <CardHeader>
                      <CardTitle className="flex items-center text-green-400">
                        <Plus className="mr-2 h-5 w-5" />
                        New Post
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </Link>
          
                <Link href="/admin/posts">
                  <Card className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border-blue-700/50 hover:border-blue-600 transition-all cursor-pointer">
                    <CardHeader>
                      <CardTitle className="flex items-center text-blue-400">
                        <FileText className="mr-2 h-5 w-5" />
                        Manage Posts
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </Link>
          
                <Link href="/admin/users">
                  <Card className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 border-purple-700/50 hover:border-purple-600 transition-all cursor-pointer">
                    <CardHeader>
                      <CardTitle className="flex items-center text-purple-400">
                        <Users className="mr-2 h-5 w-5" />
                        Manage Users
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </Link>
              </div>
          
              {/* Recent Posts */}
              {recentPosts.length > 0 && (
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Recent Posts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentPosts.map((post) => (
                        <div key={post.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                          <div className="flex-1">
                            <h3 className="text-white font-medium">{post.title}</h3>
                            <p className="text-sm text-gray-400">
                              {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            post.status === 'published' 
                              ? 'bg-green-900/30 text-green-400' 
                              : 'bg-yellow-900/30 text-yellow-400'
                          }`}>
                            {post.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        
        </main>
      </div>
    </div>
  );
}
