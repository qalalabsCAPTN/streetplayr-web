import { NextResponse } from 'next/server';
import {
  uniwareChannelAccessToken,
  uniwareChannelCredentialsOk,
} from '@/src/integrations/unicommerce/channel-auth';

function credentialsFrom(request: Request): { username: string; password: string } {
  const url = new URL(request.url);
  return {
    username: url.searchParams.get('username') || request.headers.get('username') || '',
    password: url.searchParams.get('password') || request.headers.get('password') || '',
  };
}

async function issueToken(request: Request) {
  let username = '';
  let password = '';
  try {
    const body = await request.clone().json();
    username = String(body?.username ?? '');
    password = String(body?.password ?? '');
  } catch {
    /* query / headers */
  }
  const q = credentialsFrom(request);
  username = username || q.username;
  password = password || q.password;

  if (!uniwareChannelCredentialsOk(username, password)) {
    return NextResponse.json({ status: 'FAILED', errorMessage: 'Bad credentials' }, { status: 401 });
  }

  return NextResponse.json({
    status: 'SUCCESS',
    accessToken: uniwareChannelAccessToken(),
    access_token: uniwareChannelAccessToken(),
  });
}

export async function GET(request: Request) {
  return issueToken(request);
}

export async function POST(request: Request) {
  return issueToken(request);
}
