import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AppShell } from "./AppShell";

const meta = { title: "Foundation/AppShell", component: AppShell, args: { navigation: [{ href: "/", label: "الرئيسية" }, { href: "/explore", label: "استكشف" }, { href: "/ask/start", label: "اسأل" }], children: <section><h1>معرفة موثوقة، بمصادر واضحة</h1><p>تركيب تجريبي لاختبار RTL والاستجابة.</p></section> } } satisfies Meta<typeof AppShell>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const WithNotifications: Story = { args: { unreadNotifications: 3 } };
export const NestedWithoutMainLandmark: Story = { args: { nested: true } };
export const ScholarlyDiscoveryShell: Story = {
  args: {
    search: <label>ابحث في المعرفة <input type="search" /></label>,
    actions: <button type="button">حسابي</button>,
    contextualRail: <section><h2>للاستكشاف</h2><p>موضوعات ومصادر مختارة.</p></section>,
  },
};
