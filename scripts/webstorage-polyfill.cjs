// Preloaded via NODE_OPTIONS (-r) by the npm scripts. Node 24+ enables Web
// Storage by default; without a valid --localstorage-file it leaves a broken
// `localStorage` global ({} with no methods), which crashes Next.js SSR. This
// installs a safe in-memory localStorage/sessionStorage when the global is
// missing or broken. Harmless on Node versions where it is undefined.
function makeStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(String(k)) ? m.get(String(k)) : null),
    setItem: (k, v) => { m.set(String(k), String(v)); },
    removeItem: (k) => { m.delete(String(k)); },
    clear: () => { m.clear(); },
    key: (i) => Array.from(m.keys())[i] ?? null,
    get length() { return m.size; },
  };
}
for (const name of ["localStorage", "sessionStorage"]) {
  const cur = globalThis[name];
  if (!cur || typeof cur.getItem !== "function") {
    try {
      Object.defineProperty(globalThis, name, {
        value: makeStorage(), configurable: true, writable: true,
      });
    } catch {
      try { globalThis[name] = makeStorage(); } catch {}
    }
  }
}
