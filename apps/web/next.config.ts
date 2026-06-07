import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  transpilePackages: ["@kimi/chemistry-engine", "@kimi/data"],
};

export default withNextIntl(nextConfig);
