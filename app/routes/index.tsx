import type { Route } from "./+types";

import {
  createSearchParams,
  data,
  parsePath,
  redirect,
  useFetcher,
} from "react-router";
import {
  getSession,
  commitSession,
  type SessionData,
} from "../sessions.server";
import { Layout } from "~/components/layout";
import { Suspense } from "react";
import { getStage } from "~/util/get-stage";
import { processState } from "~/util/process-state";
import { Loading } from "~/components/loading";
import { ErrorMessage } from "~/components/error-message";
import { STAGES } from "~/util/stages";
import { SCREENS } from "~/screens";
import { logger } from "~/util/logger";
import f from "~/util/mock-fetch";

export async function action({ request, context }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const path = parsePath(request.url);
  const search = createSearchParams(path.search);

  if (!session.get("pds_dest")) {
    session.set(
      "pds_dest",
      search.get("destination") ??
        process?.env?.PDS_HOSTNAME ??
        context.cloudflare.env.PDS_HOSTNAME
    );
  }

  if (!session.get("plc_hostname")) {
    session.set(
      "plc_hostname",
      search.get("plc") ??
        process?.env?.PLC_HOSTNAME ??
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
    const migratorBackend =
      process?.env?.MIGRATOR_BACKEND ?? context.cloudflare.env.MIGRATOR_BACKEND;
    const state = await processState(session, data, migratorBackend);
    stage = getStage(state);
  } catch (e) {
    logger.error("error in index action");
    console.log(e);
    if (e instanceof Error) {
      session.flash("error", e.message);
    }
  }

  logger.debug("action: ", stage);

  return redirect(
    // stage === STAGES.DONE
    //   ? "/success"
    //   : stage === STAGES.FAILED
    //     ? "/failed"
    //     : "/",
    "/",
    {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    }
  );
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const state = session.data as SessionData;

  try {
    const stage = getStage(state);
    logger.debug(
      stage,
      {
        ...session.data,
        token_origin: "<HIDDEN>",
        token_dest: "<HIDDEN>",
      },
      {
        ...state,
        token_dest: "<HIDDEN>",
        token_origin: "<HIDDEN>",
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
