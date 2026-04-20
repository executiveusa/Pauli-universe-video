import { NextRequest, NextResponse } from 'next/server';

const AGENT_URL = process.env.VIDEO_STUDIO_AGENT_URL || 'http://localhost:8000';

async function forwardRequest(
  req: NextRequest,
  path: string,
  method: string
) {
  try {
    const url = `${AGENT_URL}${path}`;
    const body = method !== 'GET' ? await req.json().catch(() => ({})) : undefined;

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.VIDEO_STUDIO_API_KEY || ''}`
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Video Studio Agent error:', error);
    return NextResponse.json(
      { error: 'Failed to communicate with video studio agent' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { route: string[] } }
) {
  const path = '/' + params.route.join('/');
  return forwardRequest(req, path, 'GET');
}

export async function POST(
  req: NextRequest,
  { params }: { params: { route: string[] } }
) {
  const path = '/' + params.route.join('/');

  // Parse query params from URL
  const url = new URL(req.url);
  const queryParams = new URLSearchParams(url.search);
  const pathWithQuery = queryParams.toString() ? `${path}?${queryParams}` : path;

  return forwardRequest(req, pathWithQuery, 'POST');
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { route: string[] } }
) {
  const path = '/' + params.route.join('/');
  return forwardRequest(req, path, 'PUT');
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { route: string[] } }
) {
  const path = '/' + params.route.join('/');
  return forwardRequest(req, path, 'DELETE');
}
