import { adsTxtResponse } from "@/components/ads/adsTxt";

// Fixed for a deployment (the publisher ID is a build-time variable).
export const dynamic = "force-static";

export function GET() {
  return adsTxtResponse();
}
