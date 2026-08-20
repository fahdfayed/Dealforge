import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hosts allowed to request dev-only assets when the dev server is reached
  // from something other than localhost (e.g. another device on the LAN).
  allowedDevOrigins: ["192.168.70.254"],
};

export default nextConfig;
