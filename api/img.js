// XO's market pictures come from three places without CORS headers (its two buckets and football
// crests), so the card's PNG export can't inline them directly. Only these hosts pass, cached.
const ALLOWED = [
  "https://storage.googleapis.com/market-image-mainnet/",
  "https://market-images-623756711122.s3.eu-west-1.amazonaws.com/",
  "https://crests.football-data.org/",
];

export default async function handler(req, res) {
  const u = String(req.query.u || "");
  if (!ALLOWED.some((a) => u.startsWith(a)) || u.includes("..")) return res.status(400).end();
  try {
    const r = await fetch(u, { signal: AbortSignal.timeout(8000) });
    const type = r.headers.get("content-type") || "";
    if (!r.ok || !type.startsWith("image/")) return res.status(404).end();
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 3_000_000) return res.status(413).end();
    res.setHeader("Content-Type", type);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800, immutable");
    return res.status(200).send(buf);
  } catch (e) {
    console.error("img proxy", u, e?.message);
    return res.status(502).end();
  }
}
