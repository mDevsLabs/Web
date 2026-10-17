// Les WebViews détectent le déploiement courant sans mettre en cache sa version.
export async function GET() {
  return Response.json(
    { buildId: process.env.NEXT_PUBLIC_MAI_WEB_BUILD_ID },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
