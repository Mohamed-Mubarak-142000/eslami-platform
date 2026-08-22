import { ModerationQueue } from "@/features";
export default function Page() { return <ModerationQueue cases={[{ id: "verification-1", status: "قيد المراجعة", priority: "عادية", kind: "verification", ageLabel: "يومان", version: 1 }]} />; }
