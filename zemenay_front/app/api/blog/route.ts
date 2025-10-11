import { NextResponse, NextRequest } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const backendUrl = `${BACKEND_URL}/posts${queryString ? `?${queryString}` : ''}`;
    
    console.log('Proxying GET request to:', backendUrl);
    
    const authHeader = request.headers.get('authorization');
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { 'Authorization': authHeader } : {}),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Backend error:', data);
      return new NextResponse(
        JSON.stringify({ error: data.message || 'Failed to fetch posts' }),
        { status: response.status, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

   // Check if it's an array (list of posts) or single object (post by slug)
const responseData = Array.isArray(data) ? { data: data } : data;

return new NextResponse(
  JSON.stringify(responseData),
  { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
);
  } catch (error: any) {
    console.error('Error in GET /api/blog:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const postData = await request.json();
    
    console.log('Proxying POST request to:', `${BACKEND_URL}/posts`);
    
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const response = await fetch(`${BACKEND_URL}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(postData),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Backend error:', data);
      return new NextResponse(
        JSON.stringify({ error: data.message || 'Failed to create post' }),
        { status: response.status, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    return new NextResponse(
      JSON.stringify(data),
      { status: 201, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error: any) {
    console.error('Error in POST /api/blog:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}