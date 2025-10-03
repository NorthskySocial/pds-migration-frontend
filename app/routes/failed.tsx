import { redirect, data, useFetcher } from "react-router";
import { getSession, commitSession } from "../sessions.server";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  return data({ error: session.get("error") });
}

export async function action({ request, context }: Route.ActionArgs) {}
export default function FailRoute({ loaderData }: Route.ComponentProps) {}
