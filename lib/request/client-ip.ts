import { headers } from "next/headers";

// No reverse proxy sets these headers in local development, so requests are
// pooled under one key rather than mistakenly treated as unlimited.
const FALLBACK_CLIENT_ID = "unknown-client";

export async function getClientIp(): Promise<string> {
  const headerList = await headers();

  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) {
    const [first] = forwardedFor.split(",");
    if (first?.trim()) {
      return first.trim();
    }
  }

  const realIp = headerList.get("x-real-ip");
  if (realIp?.trim()) {
    return realIp.trim();
  }

  return FALLBACK_CLIENT_ID;
}
