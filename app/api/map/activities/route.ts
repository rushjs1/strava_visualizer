import { fetchRunMapPage } from "@/lib/strava";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const page = Number(params.get("page") ?? "1");
  const before = Number(params.get("before"));
  const headers = { "Cache-Control": "private, no-store" };
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(before) || before < 1) {
    return Response.json({ error: "Invalid history page." }, { status: 400, headers });
  }
  try {
    return Response.json(await fetchRunMapPage(page, before), { headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const limited = message.includes("429");
    return Response.json({ error: limited
      ? "Strava's request limit was reached. Your loaded runs are still here. Try continuing later."
      : "Unable to load Strava history. Check your connection in Settings, then try again."
    }, { status: limited ? 429 : 502, headers });
  }
}
