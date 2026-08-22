import { ModerationQueue } from "@/features";
const cases = [{ id: "case-1", status: "قيد المراجعة", priority: "عادية", kind: "content" as const, ageLabel: "يوم", version: 1 }];
export default function Page() { return <ModerationQueue cases={cases} />; }
