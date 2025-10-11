// app/blog/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getBlogPost} from '@/lib/blog-api';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { FeaturedImage } from '@/components/blog/FeaturedImage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Comments } from '@/components/blog/comments';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MessageCircle,
  Share2,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ViewTracker } from './view-tracker';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const post = await getBlogPost(params.slug);

    if (!post) {
      return {
        title: 'Post Not Found | Zemenay Tech',
        description: 'The requested blog post could not be found.',
      };
    }

    return {
      title: `${post.title} | Zemenay Tech`,
      description: post.excerpt || post.content?.substring(0, 160) + '...',
      openGraph: {
        title: post.title,
        description: post.excerpt || post.content?.substring(0, 160) + '...',
        images: post.featured_image
          ? [
              {
                url: post.featured_image,
                width: 1200,
                height: 630,
                alt: post.title,
              },
            ]
          : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: post.excerpt || post.content?.substring(0, 160) + '...',
        images: post.featured_image ? [post.featured_image] : [],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Error | Zemenay Tech',
      description: 'An error occurred while loading the post.',
    };
  }
}

async function BlogPostContent({ params }: { params: { slug: string } }) {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (
    !params.slug ||
    params.slug === 'avatar-url-or-null' ||
    params.slug.includes('undefined')
  ) {
    notFound();
  }

  // Use a const declaration with an early return to ensure 'post' is non-null
  const post = await getBlogPost(params.slug);
  console.log('📝 Post data:', post);
  console.log('📝 Post ID:', post?.id);
  if (!post) {
    console.error('Post not found for slug:', params.slug);
    notFound();
  }
  // Format dates
  const formattedDate = post.created_at
    ? new Date(post.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  // Get related posts (only if the post has a category)
  


  return (
    <div className="bg-background">
      {/* View Tracker - Client Component */}
      <ViewTracker slug={params.slug} postId={post.id || ''} />

      {/* Back button and share */}
      <div className="border-b">
        <div className="container max-w-4xl py-8 px-4 flex justify-between items-center">
          <Link
            href="/blog"
            className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Link>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      <div className="container max-w-4xl py-8 px-4">
        <article className="prose dark:prose-invert prose-lg max-w-none">
          {/* Post header */}
          <header className="mb-12">
          {post.categories?.[0] && (
  <Badge variant="outline" className="mb-4">
    {post.categories[0].name}
  </Badge>
)}
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              {post.title}
            </h1>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-muted-foreground mb-8">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                {formattedDate}
              </div>
              <div className="hidden sm:block">•</div>
              <div className="flex items-center">
  <MessageCircle className="w-4 h-4 mr-2" />
  0 comments {/* Comment count not available in BlogPost type */}
</div>
</div>

            {post.featured_image ? (
              <div className="relative w-full h-[400px] md:h-[500px] mb-8 rounded-xl overflow-hidden shadow-lg">
                <FeaturedImage
                  src={post.featured_image}
                  alt={post.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 80vw"
                />
              </div>
            ) : (
              <div className="w-full h-64 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-xl mb-8 flex items-center justify-center">
                <span className="text-gray-400 dark:text-gray-600">
                  No featured image
                </span>
              </div>
            )}
          </header>

          {/* Post content */}
          <div className="prose dark:prose-invert max-w-none">
            {post.excerpt && (
              <div className="text-xl text-muted-foreground mb-8 italic">
                {post.excerpt}
              </div>
            )}

{post.content && (
  <div
    className="prose-lg dark:prose-invert max-w-none"
    dangerouslySetInnerHTML={{ 
      __html: typeof post.content === 'string' 
        ? post.content 
        : JSON.stringify(post.content) 
    }}
  />
)} 
</div>

          {/* Author info */}
          {post.author && (
            <div className="mt-12 p-6 bg-muted/20 rounded-lg">
              <div className="flex items-center gap-4">
                {post.author.avatar_url ? (
                  <img
                    src={post.author.avatar_url}
                    alt={post.author.username || 'Author'}
                    width={64}
                    height={64}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold">
                    {post.author.username?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold">
                    {post.author.username || 'Anonymous'}
                  </h3>
                  {post.author.bio && (
                    <p className="text-muted-foreground text-sm">
                      {post.author.bio}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Related Posts */}
        

  {/* Comments Section */}
<div className="mt-16">
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-2xl font-bold">Discussion</h2>
  </div>
  <Separator className="mb-8" />
  {post.id || params.slug ? (
  <Comments postId={post.id || params.slug} />
) : (
  <p className="text-red-500">Post ID missing - cannot load comments</p>
)}
</div>
        </article>
      </div>
    </div>
  );
}

export default async function BlogPostPage({ params }: Props) {
  return <BlogPostContent params={params} />;
}
