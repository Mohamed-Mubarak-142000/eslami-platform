// The AdMob app listing points at this domain, so the mobile app is verified with the same line.
import { adsTxtResponse } from "@/components/ads/adsTxt";

export function GET() {
  return adsTxtResponse();
}
