import { SavedCollections } from "@/features";
import { services } from "@/integrations";
export default function Page() { return <SavedCollections items={services.data.content} />; }
