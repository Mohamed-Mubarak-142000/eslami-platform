import type { Metadata } from "next";
import { Explore } from "@/features";
import { services } from "@/integrations";
export const metadata: Metadata = { title: "استكشف", description: "استكشف الموضوعات والباحثين الموثقين." };
export default function Page() { return <Explore topics={services.data.topics} scholars={services.data.scholars} />; }
