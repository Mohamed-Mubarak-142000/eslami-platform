import type { Preview } from "@storybook/nextjs-vite";
import "../src/styles/tokens.css";
import "../src/styles/foundations.css";

const preview: Preview = {
  parameters: {
    a11y: { test: "error" },
    backgrounds: { default: "canvas" },
    viewport: { options: { mobile: { name: "Mobile", styles: { width: "390px", height: "844px" } }, desktop: { name: "Desktop", styles: { width: "1440px", height: "900px" } } } },
  },
  decorators: [(Story) => <div dir="rtl" lang="ar"><Story /></div>],
};
export default preview;
