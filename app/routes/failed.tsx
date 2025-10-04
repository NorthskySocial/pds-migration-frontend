import { redirect, data, useFetcher } from "react-router";
import { getSession, commitSession } from "../sessions.server";
import { logger } from "~/util/logger";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  logger.debug({
    ...session.data,
    token_origin: "<HIDDEN>",
    token_dest: "<HIDDEN>",
    token_service: "<HIDDEN>",
  });
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
