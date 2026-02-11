import { data } from "react-router";
import { getSession, commitSession } from "../sessions.server";
import type { Route } from "./+types";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  return data(
    { error: session.get("error") },
    {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    }
  );
}

export async function action({ request, context }: Route.ActionArgs) {}
export default function FailRoute({ loaderData }: Route.ComponentProps) {}
