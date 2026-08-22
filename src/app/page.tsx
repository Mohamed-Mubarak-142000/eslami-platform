import { Feed } from "@/features";
import { services } from "@/integrations";
export default function HomePage() { return <Feed items={services.data.content} />; }
