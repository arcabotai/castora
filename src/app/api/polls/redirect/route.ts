import { NextResponse } from 'next/server';

export async function POST(
  req: Request,
) {
  return NextResponse.redirect('https://www.super.sc/', { status: 302 });
}