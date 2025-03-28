import type { Route } from "./+types/migration-progress";
import { Heading, Text, Progress, VStack } from "@chakra-ui/react";
import clock_art from "../assets/clock.jpg";
import { InfoTip } from "@/components/ui/toggle-tip";
import { data, redirect, useSubmit } from "react-router";
import { getSession, commitSession } from "../sessions.server";
import { useEffect } from "react";

const { MIGRATOR_BACKEND, PDS_HOSTNAME } = import.meta.env;

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

export async function action({ request }: Route.ActionArgs) {
  console.log("PAGE 6");
  const session = await getSession(request.headers.get("Cookie"));
  const old_pds = session.get("old_pds");
  const old_handle = session.get("userId_old");
  const new_handle = session.get("userId_new");
  const serviceToken = session.get("serviceToken");
  const newToken = session.get("newPdsUserToken");
  const token = session.get("accessJwt");

  const progress = session.get("progress") || defaultProgress;

  if (!old_pds || !old_handle) {
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
      const res = await fetch(`${MIGRATOR_BACKEND}/export-repo`, {
        method: "post",
        body: JSON.stringify({
          pds_host: old_pds,
          handle: old_handle,
          token,
        }),
      });

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
      const res = await fetch(`${MIGRATOR_BACKEND}/import-repo`, {
        method: "post",
        body: JSON.stringify({
          pds_host: PDS_HOSTNAME,
          handle: new_handle,
          token: newToken,
        }),
      });

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
      const res = await fetch(`${MIGRATOR_BACKEND}/missing-blobs`, {
        method: "post",
        body: JSON.stringify({
          pds_host: PDS_HOSTNAME,
          handle: new_handle,
          token: newToken,
        }),
      });

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
      // export blobs
      const res = await fetch(`${MIGRATOR_BACKEND}/export-blobs`, {
        method: "post",
        body: JSON.stringify({
          new_pds_host: PDS_HOSTNAME,
          new_handle: new_handle,
          // new_password: "<<new_password>>",
          old_pds_host: old_pds,
          old_handle: old_handle,
          // old_password: "<<old_password>>",
          token,
        }),
      });

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
      // upload blobs
      const res = await fetch(`${MIGRATOR_BACKEND}/upload-blobs`, {
        method: "post",
        body: JSON.stringify({
          pds_host: PDS_HOSTNAME,
          handle: new_handle,
          token: newToken,
        }),
      });

      if (!res.ok) {
        session.flash("error", (await res.json<{ message: string }>()).message);
        break;
      }

      session.flash("progress", {
        stageIdx: 5,
        stageTitle: "Uploading your blobs...",
        stageDescription:
          "Uploading your blobs to our CDN. This may take awhile!",
      });
      break;
    }

    case 6: {
      // migrate preferences
      const res = await fetch(`${MIGRATOR_BACKEND}/migrate-preferences`, {
        method: "post",
        body: JSON.stringify({
          new_pds_host: PDS_HOSTNAME,
          new_handle: new_handle,
          // new_password: "<<new_password>>",
          old_pds_host: old_pds,
          old_handle: old_handle,
          // old_password: "<<old_password>>",
          token,
        }),
      });

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
      const res = await fetch(`${MIGRATOR_BACKEND}/request-token`, {
        method: "post",
        body: JSON.stringify({
          pds_host: old_pds,
          handle: old_handle,
          token,
        }),
      });

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

  return data(
    { error: session.get("error"), progress: session.get("progress") },
    {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    }
  );
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
    <VStack
      margin="0 auto"
      maxWidth={"350px"}
      height={"70vh"}
      justifyContent={"space-evenly"}
      alignItems={"center"}
    >
      <Heading size="3xl" letterSpacing="tight">
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
  );
}
