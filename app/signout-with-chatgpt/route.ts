export function GET(request: Request) {
 return Response.redirect(new URL('/api/auth/logout', request.url), 302);
}
