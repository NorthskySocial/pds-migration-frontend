import type { Route } from "./+types";

import { data, redirect, useFetcher } from "react-router";
import { getSession, commitSession } from "../sessions.server";
import { Layout } from "~/components/layout";
import { lazy, Suspense, useMemo } from "react";
import { getStage, processState } from "~/util/get-stage";
import { getScreen } from "~/util/get-screen";
import { Loading } from "~/components/loading";
import { ErrorMessage } from "~/components/error-message";
import { STAGES } from "~/util/types";

export async function action({ request, context }: Route.ActionArgs) {
  console.log("aaaaa");
  const session = await getSession(request.headers.get("Cookie"));
  const data = await request.formData();
  let stage = STAGES.INVITE_CODE;

  try {
    const state = await processState(session, data, context.cloudflare.env);
    console.log(state);
    stage = getStage(state);
  } catch (e) {
    console.error(e);
    if (e instanceof Error) {
      session.flash("error", e.message);
    }
  }

  console.log("action", stage);

  return redirect(
    stage === STAGES.DONE
      ? "/success"
      : stage === STAGES.FAILED
      ? "/failed"
      : "/",
    {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    }
  );
}

export async function loader({ request }: Route.LoaderArgs) {
  console.log("lllll");
  const session = await getSession(request.headers.get("Cookie"));
  const state = {
    handle_origin: session.get("handle_origin"),
    handle_dest: session.get("handle_dest"),
    pds_dest: session.get("pds_dest"),
    pds_origin: session.get("pds_origin"),
    token_origin: session.get("token_origin"),
    token_dest: session.get("token_dest"),
    token_plc: session.get("token_plc"),
    token_service: session.get("token_service"),
    plc_hostname: session.get("plc_hostname"),
    did: session.get("did"),
    inviteCode: session.get("inviteCode"),
    email: session.get("email"),

    // state flags
    hasBackup: session.get("hasBackup") ?? false,
    migratedRepo: session.get("migratedRepo") ?? false,
    migratedBlobs: session.get("migratedBlobs") ?? false,
    migratedPrefs: session.get("migratedPrefs") ?? false,
    originDeactivated: session.get("originDeactivated") ?? false,
    destActivated: session.get("destActivated") ?? false,
    migratedPlc: session.get("migratedPlc") ?? false,
  };

  const stage = getStage(state);

  return data(
    { error: session.get("error"), stage, state },
    {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    }
  );
}

export default function Index({ loaderData }: Route.ComponentProps) {
  const { error, state, stage = STAGES.INVITE_CODE } = loaderData;
  const fetcher = useFetcher();
  console.log(error, state, stage);

  const Stage = useMemo(() => getScreen(stage), [stage]);

  return (
    <Layout>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <Suspense fallback={<Loading />}>
        {fetcher.state !== "idle" ? <Loading /> : <Stage state={state} />}
      </Suspense>
    </Layout>
  );
}
