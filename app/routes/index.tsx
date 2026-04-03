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
  type ErrorType,
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
import { BaseAppError } from "~/errors";
import { checkPdsHealth } from "~/actions";

export async function action({ request, context }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const path = parsePath(request.url);
  const search = createSearchParams(path.search);

  if (!session.get("pds_dest")) {
    session.set(
      "pds_dest",
      search.get("destination") ??
        process?.env?.PDS_HOSTNAME
    );
  }

  if (!session.get("plc_hostname")) {
    session.set(
      "plc_hostname",
      search.get("plc") ??
        process?.env?.PLC_HOSTNAME ??
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
    const migratorBackend = process?.env?.MIGRATOR_BACKEND;
    if (!migratorBackend) {
      throw new Error("MIGRATOR_BACKEND environment variable is not set");
    }
    const state = await processState(session, data, migratorBackend);
    stage = getStage(state);
  } catch (e) {
    logger.error("error in index action");
    console.log(e, e instanceof BaseAppError ? e.errorType : "Not BaseAppError");
    if (e instanceof BaseAppError) {
      session.flash("error", e.message);
      session.flash("errorType", e.errorType);
    } else if (e instanceof Error) {
      session.flash("error", e.message);
      session.flash("errorType", "Unexpected");
    }
  }

  logger.debug("action: ", stage);

  return redirect(
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
  const supportFormUrl = process.env?.SUPPORT_FORM_URL;

  const forceMaintenance = new URL(request.url)
    .searchParams
    .get("force_maintenance") === "true";

  if (forceMaintenance || !(await checkPdsHealth())) {
    return data(
      {
        error: undefined,
        errorType: undefined,
        stage: STAGES.MAINTENANCE,
        state,
        supportFormUrl,
      },
      {
        headers: {
          "Set-Cookie": await commitSession(session),
        },
      }
    );
  }

  try {
    const stage = getStage(state);
    return data(
      {
        error: session.get("error"),
        errorType: session.get("errorType"),
        stage,
        state,
        supportFormUrl,
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
        errorType: "Unexpected" as ErrorType,
        stage: STAGES.FAILED,
        state,
        supportFormUrl,
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
  const { error, errorType, state, stage = STAGES.INVITE_CODE, supportFormUrl } = loaderData;
  const fetcher = useFetcher();

  const Stage = SCREENS[stage];

  return (
    <Layout>
      {error && <ErrorMessage errorType={errorType} supportFormUrl={supportFormUrl}>{error}</ErrorMessage>}
      <Suspense fallback={<Loading />}>
        {fetcher.state !== "idle" ? (
          <Loading />
        ) : (
          <Stage stage={stage} state={state} error={error} supportFormUrl={supportFormUrl} />
        )}
      </Suspense>
    </Layout>
  );
}
