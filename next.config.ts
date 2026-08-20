import type { NextConfig } from "next";

// Hosts allowed to request dev-only assets when the dev server is reached from
// something other than localhost — e.g. a phone or laptop on the same network
// hitting http://192.168.1.225:3000.
//
// These are the private IPv4 ranges. The machine's LAN address is handed out by
// DHCP and changes, so naming a single address means this breaks again on the
// next lease. Next matches these per dot-segment, so a whole segment must be
// "*" — a partial wildcard like "172.2*.*.*" would never match.
//
// Dev-only: the option has no effect on `next build` / `next start`.
//
// When an origin is not listed, Next blocks its requests for dev assets, the
// client bundle never loads, and the page renders but stays inert — forms fall
// back to native submission and server actions never run.
const privateNetworkOrigins = [
  "192.168.*.*",
  "10.*.*.*",
  // 172.16.0.0/12 — the private block runs from 172.16 to 172.31.
  ...Array.from({ length: 16 }, (_, i) => `172.${16 + i}.*.*`),
];

const nextConfig: NextConfig = {
  allowedDevOrigins: privateNetworkOrigins,
};

export default nextConfig;
