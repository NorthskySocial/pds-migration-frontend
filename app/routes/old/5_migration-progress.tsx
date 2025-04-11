import type { Route } from "./+types/5_migration-progress";
import { Heading, Text, Progress, VStack } from "@chakra-ui/react";
import clock_art from "../assets/clock.jpg";
import { InfoTip } from "@/components/ui/toggle-tip";
import { data, redirect, useSubmit } from "react-router";
import { getSession, commitSession } from "../sessions.server";
import { useEffect } from "react";
import { Layout } from "~/components/layout";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  return data(
    { error: session.get("error"), progress: session.get("progress") },
    {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    }
  );
}

const defaultProgress = {
  stageTitle: "Starting migration...",
  stageDescription: "Migration is beginning. Please wait.",
  stageIdx: 0,
};

export async function action({ request, context }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const pds_origin = session.get("pds_origin") as string;
  const pds_dest = session.get("pds_dest") as string;
  const did = session.get("did") as string;
  const token_dest = session.get("token_dest") as string;
  const token_origin = session.get("token_origin") as string;

  const progress = session.get("progress") || defaultProgress;
  console.log(`PAGE 6, STAGE ${progress.stageIdx}`);

  if (!pds_origin || !did) {
    session.flash(
      "error",
      "Unable to resolve old account; please login again."
    );

    // Redirect back to the login page with errors.
    return redirect("/connect-bluesky", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }

  switch (progress.stageIdx + 1) {
    case 0:
    default: {
      session.flash("progress", {
        stageTitle: "Starting migration...",
        stageDescription: "Migration is beginning. Please wait.",
        stageIdx: 0,
      });
      break;
    }
    case 1: {
      // export repo
      const res = await fetch(
        `${context.cloudflare.env.MIGRATOR_BACKEND}/export-repo`,
        {
          method: "post",
          body: JSON.stringify({
            pds_host: pds_origin,
            did,
            token: token_origin,
          }),
        }
      );

      if (!res.ok) {
        session.flash("error", (await res.json<{ message: string }>()).message);
        break;
      }

      session.flash("progress", {
        stageIdx: 1,
        stageTitle: "Exporting your old account data...",
        stageDescription:
          "Copying your account data from your old PDS to Northsky",
      });

      break;
    }

    case 2: {
      // import repo
      const res = await fetch(
        `${context.cloudflare.env.MIGRATOR_BACKEND}/import-repo`,
        {
          method: "post",
          body: JSON.stringify({
            pds_host: pds_dest,
            did,
            token: token_dest,
          }),
        }
      );

      if (!res.ok) {
        session.flash("error", (await res.json<{ message: string }>()).message);
        break;
      }

      session.flash("progress", {
        stageIdx: 2,
        stageTitle: "Importing your account data...",
        stageDescription:
          "Copying your account data from your old PDS to Northsky",
      });

      break;
    }

    case 3: {
      // missing blobs
      const res = await fetch(
        `${context.cloudflare.env.MIGRATOR_BACKEND}/export-blobs`,
        {
          method: "post",
          body: JSON.stringify({
            did,
            destination: pds_dest,
            destination_token: token_dest,
            origin: pds_origin,
            origin_token: token_origin,
          }),
        }
      );

      if (!res.ok) {
        session.flash("error", (await res.json<{ message: string }>()).message);
        break;
      }

      session.flash("progress", {
        stageIdx: 3,
        stageTitle: "Exporting your old account blobs...",
        stageDescription: "Copying your blobs from your old PDS to Northsky",
      });
      break;
    }

    case 4: {
      // upload blobs
      const res = await fetch(
        `${context.cloudflare.env.MIGRATOR_BACKEND}/upload-blobs`,
        {
          method: "post",
          body: JSON.stringify({
            pds_host: pds_dest,
            did,
            token: token_dest,
          }),
        }
      );

      if (!res.ok) {
        session.flash("error", (await res.json<{ message: string }>()).message);
        break;
      }

      session.flash("progress", {
        stageIdx: 4,
        stageTitle: "Exporting your old account blobs...",
        stageDescription: "Copying your blobs from your old PDS to Northsky",
      });
      break;
    }

    case 5: {
      // migrate preferences
      const res = await fetch(
        `${context.cloudflare.env.MIGRATOR_BACKEND}/migrate-preferences`,
        {
          method: "post",
          body: JSON.stringify({
            did,
            destination: pds_dest,
            destination_token: token_dest,
            origin: pds_origin,
            origin_token: token_origin,
          }),
        }
      );

      if (!res.ok) {
        session.flash("error", (await res.json<{ message: string }>()).message);
        break;
      }

      session.flash("progress", {
        stageIdx: 6,
        stageTitle: "Migrating your preferences",
        stageDescription: "Copying your preference data to Northsky",
      });

      break;
    }

    case 7: {
      // req PLC token
      const res = await fetch(
        `${context.cloudflare.env.MIGRATOR_BACKEND}/request-token`,
        {
          method: "post",
          body: JSON.stringify({
            pds_host: pds_origin,
            did,
            token: token_origin,
          }),
        }
      );

      if (!res.ok) {
        session.flash("error", (await res.json<{ message: string }>()).message);
        break;
      }

      session.flash("progress", {
        stageIdx: 7,
        stageTitle: "Requesting a PLC token",
        stageDescription:
          "Requesting a token to migrate your PLC data... Almost done!",
      });
      break;
    }

    case 8: {
      return redirect("/validate-plc-token", {
        headers: {
          "Set-Cookie": await commitSession(session),
        },
      });
    }
  }

  return redirect("/migrate", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

export default function Migrate({ loaderData }: Route.ComponentProps) {
  const { progress, error } = loaderData;
  const {
    stageTitle = "Migrating...",
    stageDescription = "Migrating your data to Northsky's servers",
    stageIdx = 5,
  } = progress ?? {};

  const submit = useSubmit();

  // Immediately submit to go to next step
  useEffect(() => {
    (async () => {
      setTimeout(async () => {
        await submit(null, { action: "/migrate", method: "post" });
      }, 2000);
    })();
  }, [submit]);

  return (
    <Layout>
      <VStack
        margin="0 auto"
        maxWidth={"350px"}
        height={"70vh"}
        justifyContent={"space-evenly"}
        alignItems={"center"}
      >
        <Heading size="3xl" letterSpacing="tight" textAlign={"center"}>
          Migrating....
        </Heading>
        <Text fontSize="md" textAlign={"center"}>
          Your data is being moved to our servers
        </Text>
        <img
          alt="A clock by artist Katie Tightpussy"
          src={clock_art}
          className="katie-clock"
        />
        {error ? (
          <h1>{error}</h1>
        ) : (
          <Progress.Root
            width="100%"
            max={8}
            min={0}
            value={stageIdx}
            striped
            animated
          >
            <Progress.Label mb="2">
              {stageTitle}
              <InfoTip>{stageDescription}</InfoTip>
            </Progress.Label>
            <Progress.Track>
              <Progress.Range />
            </Progress.Track>
          </Progress.Root>
        )}
      </VStack>
    </Layout>
  );
}
