import type { Config } from "@react-router/dev/config";

export default {
  basename: "/osrsHA",
  ssr: false,
  async prerender() {
    return ["/"];
  },
} satisfies Config;