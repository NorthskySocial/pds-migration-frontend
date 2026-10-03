export async function loader() {
  return Response.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}
