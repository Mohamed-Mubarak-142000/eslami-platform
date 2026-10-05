import { HomeHero } from "@/features/home/HomeHero";
import { HomeSections } from "@/features/home/HomeSections";
import { HomeSponsors } from "@/features/home/HomeSponsors";

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <HomeSections />
      <HomeSponsors />
    </>
  );
}
