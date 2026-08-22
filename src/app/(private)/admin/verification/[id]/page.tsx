import { FeatureState, ReviewDecision } from "@/features";
import { canAccessAdminRoute } from "@/integrations/route-authorization";

export default function Page() {
  if (!canAccessAdminRoute("verification")) {
    return <FeatureState status="privacy"><span /></FeatureState>;
  }

  return <ReviewDecision reviewCase={{ id: "verification-1", status: "قيد المراجعة", priority: "عادية", kind: "verification", ageLabel: "يومان", version: 1 }} />;
}
