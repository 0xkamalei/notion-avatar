import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // Local mode: No session management required
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     */
    '/((?!_next/static|_next/image|favicon.ico|avatar|icon|image|fonts|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
