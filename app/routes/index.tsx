import type { Route } from "./+types";

import {
  createSearchParams,
  data,
  parsePath,
  redirect,
  useFetcher,
} from "react-router";
import { getSession, commitSession } from "../sessions.server";
import { Layout } from "~/components/layout";
import { Suspense } from "react";
import { getStage } from "~/util/get-stage";
import { processState } from "~/util/process-state";
import { Loading } from "~/components/loading";
import { ErrorMessage } from "~/components/error-message";
import { STAGES } from "~/util/stages";
import { SCREENS } from "~/screens";
import { logger } from "~/util/logger";

export async function action({ request, context }: Route.ActionArgs) {
  logger.log("ACTION");
  const session = await getSession(request.headers.get("Cookie"));
  const path = parsePath(request.url);
  const search = createSearchParams(path.search);

  if (!session.get("pds_dest")) {
    session.set(
      "pds_dest",
      search.get("destination") ?? context.cloudflare.env.PDS_HOSTNAME
    );
  }

  if (!session.get("plc_hostname")) {
    session.set(
      "plc_hostname",
      search.get("plc") ??
        context.cloudflare.env.PLC_HOSTNAME ??
        "https://plc.directory"
    );
  }

  const pds_dest = session.get("pds_dest");
  const plc_hostname = session.get("plc_hostname");

  session.set("pds_dest", pds_dest);
  session.set("plc_hostname", plc_hostname);

  const data = await request.formData();
  let stage = STAGES.INVITE_CODE;

  try {
    const state = await processState(session, data, context.cloudflare.env);
    logger.log(state);
    stage = getStage(state);
  } catch (e) {
    console.error("error in index action", e);
    if (e instanceof Error) {
      session.flash("error", e.message);
    }
  }

  logger.log("action", stage);

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
  const session = await getSession(request.headers.get("Cookie"));

  const state = {
    do_journey: session.get("do_journey"),
    handle_origin: session.get("handle_origin"),
    handle_dest: session.get("handle_dest"),
    pds_dest: session.get("pds_dest"),
    pds_origin: session.get("pds_origin"),
    token_origin: session.get("token_origin"),
    token_dest: session.get("token_dest"),
    token_service: session.get("token_service"),
    plc_hostname: session.get("plc_hostname"),
    did: session.get("did"),
    inviteCode: session.get("inviteCode"),
    email: session.get("email"),
    user_recover_key: session.get("user_recover_key"),

    // state flags
    hasBackup: session.get("hasBackup") ?? false,
    exportedRepo: session.get("exportedRepo") ?? false,
    importedRepo: session.get("importedRepo") ?? false,
    exportedBlobs: session.get("exportedBlobs") ?? false,
    importedBlobs: session.get("importedBlobs") ?? false,
    migratedPrefs: session.get("migratedPrefs") ?? false,
    requestedPlcToken: session.get("requestedPlcToken") ?? false,
    originDeactivated: session.get("originDeactivated") ?? false,
    destActivated: session.get("destActivated") ?? false,
    migratedPlc: session.get("migratedPlc") ?? false,
  };

  try {
    const stage = getStage(state);
    logger.debug(
      stage,
      {
        ...session.data,
        token_origin: "<HIDDEN>",
        token_dest: "<HIDDEN>",
        token_service: "<HIDDEN>",
      },
      {
        ...state,
        token_dest: "<HIDDEN>",
        token_origin: "<HIDDEN>",
        token_service: "<HIDDEN>",
      }
    );
    return data(
      {
        error: session.get("error"),
        stage,
        state,
      },
      {
        headers: {
          "Set-Cookie": await commitSession(session),
        },
      }
    );
  } catch (e) {
    console.error(e, state);
    return data(
      {
        error: (e as Error).message,
        stage: STAGES.FAILED,
        state,
      },
      {
        headers: {
          "Set-Cookie": await commitSession(session),
        },
      }
    );
  }
}

export default function Index({ loaderData }: Route.ComponentProps) {
  const { error, state, stage = STAGES.INVITE_CODE } = loaderData;
  const fetcher = useFetcher();

  const Stage = SCREENS[stage];

  return (
    <Layout>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <Suspense fallback={<Loading />}>
        {fetcher.state !== "idle" ? (
          <Loading />
        ) : (
          <Stage stage={stage} state={state} error={error} />
        )}
      </Suspense>
    </Layout>
  );
}
