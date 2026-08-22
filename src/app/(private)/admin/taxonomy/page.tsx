import { TaxonomyManager } from "@/features";
import { services } from "@/integrations";
export default function Page() { return <TaxonomyManager names={[...services.data.topics.map(item => item.name), "الفقه وأصوله"]} canEdit />; }
