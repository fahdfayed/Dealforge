// UUID generation that works outside secure contexts.
//
// `crypto.randomUUID()` is only exposed on secure origins (HTTPS or
// localhost), so it is undefined when the dev server is reached over a plain
// LAN address such as http://192.168.1.10:3000. `crypto.getRandomValues()`
// carries no such restriction, so we fall back to building a v4 UUID from it
// and keep the same randomness quality.

export function newId(): string {
  const c: Crypto | undefined = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;

  if (typeof c?.randomUUID === "function") {
    return c.randomUUID();
  }

  if (typeof c?.getRandomValues === "function") {
    const bytes = c.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  throw new Error("No crypto source available for ID generation");
}
