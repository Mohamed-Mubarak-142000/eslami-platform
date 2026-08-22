import { FeatureState, ReviewDecision } from "@/features";
import { canAccessAdminRoute } from "@/integrations/route-authorization";

export default function Page() {
  if (!canAccessAdminRoute("moderation")) {
    return <FeatureState status="privacy"><span /></FeatureState>;
  }

  return <ReviewDecision reviewCase={{ id: "case-1", status: "قيد المراجعة", priority: "عادية", kind: "content", ageLabel: "يوم", version: 1 }} />;
}
