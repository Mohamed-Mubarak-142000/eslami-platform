import { Onboarding } from "@/features";
import { services } from "@/integrations";
export default async function Page({ params }: { params: Promise<{ step: string }> }) { const { step } = await params; return <Onboarding step={Math.min(3, Math.max(1, Number(step) || 1))} interests={services.data.topics.map(item => item.name)} />; }
