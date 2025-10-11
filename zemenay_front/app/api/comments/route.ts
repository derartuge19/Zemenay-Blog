import { NextResponse, NextRequest } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
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
    const backendUrl = `${BACKEND_URL}/comments${queryString ? `?${queryString}` : ''}`;
    
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
      return NextResponse.json(
        { error: data.message || 'Failed to fetch comments' },
        { status: response.status, headers: corsHeaders }
      );
    }

    return NextResponse.json(data, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Error in GET /api/comments:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const commentData = await request.json();
    const authHeader = request.headers.get('authorization');

    console.log('📝 POST /api/comments - Comment data:', commentData);
    console.log('📝 POST /api/comments - Backend URL:', `${BACKEND_URL}/comments`);

    const response = await fetch(`${BACKEND_URL}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { 'Authorization': authHeader } : {}),
      },
      body: JSON.stringify(commentData),
    });

    const data = await response.json();
    console.log('📝 POST /api/comments - Backend response:', { status: response.status, data });

    if (!response.ok) {
      console.error('❌ POST /api/comments - Backend error:', data);
      return NextResponse.json(
        { message: data.message || 'Failed to create comment', error: data.error, details: data },
        { status: response.status, headers: corsHeaders }
      );
    }

    return NextResponse.json(data, { status: 201, headers: corsHeaders });
  } catch (error: any) {
    console.error('❌ POST /api/comments - Server error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}