import { AnswerEditor } from "@/features";
import { can } from "@/domain";
import { services } from "@/integrations";
export default function Page() { return <AnswerEditor permission={can(services.session.account, "answer", { specialtyMatches: true })} />; }
