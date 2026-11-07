// Só Zernio, protegido por senha (ADMIN_PASSWORD).
import { timingSafeEqual } from "node:crypto";

const J = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const ok = (a, b) => { const x = Buffer.from(String(a || "")), y = Buffer.from(String(b || "")); return x.length === y.length && timingSafeEqual(x, y); };

export default async (req) => {
  const u = new URL(req.url), p = u.pathname;
  const PASS = process.env.ADMIN_PASSWORD, KEY = process.env.ZERNIO_API_KEY;
  if (!PASS || !KEY) return J({ e: "Faltam ADMIN_PASSWORD e/ou ZERNIO_API_KEY nas variáveis do Netlify." }, 500);
  if (!ok(req.headers.get("x-senha") || u.searchParams.get("senha"), PASS)) return J({ e: "auth" }, 401);
  const z = (path, init = {}) => fetch("https://zernio.com/api/v1" + path, { ...init, headers: { authorization: "Bearer " + KEY, "content-type": "application/json" } });
  try {
    if (p === "/api/zernio/accounts") {
      const r = await z("/accounts");
      return J(await r.json(), r.status);
    }
    if (p === "/api/zernio/post" && req.method === "POST") {
      const b = await req.json();
      if (!b.content || !b.platform || !b.accountId) return J({ e: "faltam content, platform ou accountId" }, 400);
      const r = await z("/posts", { method: "POST", body: JSON.stringify({ content: b.content, platforms: [{ platform: b.platform, accountId: b.accountId }], ...(b.scheduledFor ? { scheduledFor: b.scheduledFor } : {}) }) });
      return J(await r.json(), r.status);
    }
    return J({ e: "nf" }, 404);
  } catch (e) { return J({ e: String(e.message || e) }, 500); }
};
export const config = { path: "/api/zernio/*" };
