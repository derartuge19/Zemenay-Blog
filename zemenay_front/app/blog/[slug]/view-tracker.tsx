'use client';

import { useEffect } from 'react';

export function ViewTracker({ slug, postId }: { slug: string; postId: string }) {
  useEffect(() => {
    // View tracking is handled automatically by the backend
    // when someone visits GET /posts/slug/:slug
    console.log(`[ViewTracker] View tracking handled by backend for post: ${slug}`);
  }, [slug, postId]);

  return null;
}