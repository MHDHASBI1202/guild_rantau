declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    AUTH_PROVIDER?: string;
    GOOGLE_CLIENT_ID?: string;
    BUCKET?: R2Bucket;
  }
}
