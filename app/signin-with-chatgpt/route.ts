export function GET(request: Request) {
 const url = new URL(request.url);
 const returnTo = url.searchParams.get('return_to') || '/';
 return Response.redirect(new URL(`/masuk?return_to=${encodeURIComponent(returnTo)}`, request.url), 302);
}
