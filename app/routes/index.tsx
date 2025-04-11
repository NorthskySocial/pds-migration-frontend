import type { Route } from "./+types";

import { redirect, data, useFetcher } from "react-router";
import { getSession, commitSession } from "../sessions.server";
import { Layout } from "~/components/layout";
import { lazy, Suspense, useState } from "react";
import { getScreen, getStage, processState } from "~/util/get-stage";
import { Loading } from "~/components/loading";

export async function loader({ request }: Route.LoaderArgs) {
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

export async function action({ request, context }: Route.ActionArgs) {
  const { MIGRATOR_BACKEND, PDS_HOSTNAME, PLC_HOSTNAME } =
    context.cloudflare.env;

  const session = await getSession(request.headers.get("Cookie"));
  const data = await request.formData();

  return await processState(session, data);
}

export default function Index({ loaderData }: Route.ComponentProps) {
  const { error, state, stage } = loaderData;
  const fetcher = useFetcher();
  const Stage = lazy(() => getScreen(stage));
  return (
    <Layout>
      {error && <div>{error}</div>}
      <fetcher.Form method="post">
        <Suspense fallback={<Loading />}>
          <Stage state={state} />
        </Suspense>
      </fetcher.Form>
    </Layout>
  );
}
