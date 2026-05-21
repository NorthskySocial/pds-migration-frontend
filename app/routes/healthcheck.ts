import type { Route } from "./+types";

export async function loader({ request }: Route.LoaderArgs) {
  return Response.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
