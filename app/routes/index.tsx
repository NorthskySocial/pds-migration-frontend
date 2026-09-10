import type { Route } from "./+types";

import { useFetcher } from "react-router";
import { Layout } from "~/components/layout";
import { Suspense } from "react";
import { Loading } from "~/components/loading";
import { ErrorMessage } from "~/components/error-message";
import { STAGES } from "~/util/stages";
import { SCREENS } from "~/screens";

export { action, loader } from "./index.server";

export function meta(): ReturnType<Route.MetaFunction> {
  return [{ title: "Migrate to Northsky!" }];
}

export default function Index({ loaderData }: Route.ComponentProps) {
  const {
    title,
    error,
    errorType,
    state,
    stage = STAGES.INVITE_CODE,
    supportFormUrl,
    isUpstreamOutage,
  } = loaderData;
  const fetcher = useFetcher();

  const Stage = SCREENS[stage];

  return (
    <Layout>
      {error && (
        <ErrorMessage title={title} errorType={errorType} supportFormUrl={supportFormUrl}>
          {error}
        </ErrorMessage>
      )}
      <Suspense fallback={<Loading />}>
        {fetcher.state !== "idle" ? (
          <Loading />
        ) : (
          <Stage
            stage={stage}
            state={state}
            error={error}
            supportFormUrl={supportFormUrl}
            isUpstreamOutage={isUpstreamOutage}
          />
        )}
      </Suspense>
    </Layout>
  );
}
