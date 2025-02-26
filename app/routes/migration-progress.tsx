import type { Route } from "./+types/migration-progress";
import { Heading, Text, Progress, VStack, Button } from "@chakra-ui/react";
import clock_art from "../assets/clock.jpg";
import misleading_notice from "../assets/misleading.png";
import melted_clock from "../assets/melted.jpg";
import { data, redirect, useFetcher } from "react-router";
import { getSession, commitSession } from "../sessions.server";

const { MIGRATOR_BACKEND, PDS_HOSTNAME } = import.meta.env;

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

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const old_pds = session.get("old_pds");
  const old_handle = session.get("userId_old");
  const new_handle = session.get("userId_new");
  const userToken = session.get("newPdsUserToken");

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

  // export repo
  fetch(`${MIGRATOR_BACKEND}/export-repo`, {
    method: "post",
    body: JSON.stringify({
      pds_host: old_pds,
      handle: old_handle,
      password: "<<old_password>>",
    }),
  });

  // import repo
  fetch(`${MIGRATOR_BACKEND}/import-repo`, {
    method: "post",
    body: JSON.stringify({
      pds_host: PDS_HOSTNAME,
      handle: new_handle,
      password: "<<new_password>>",
    }),
  });

  // missing blobs
  fetch(`${MIGRATOR_BACKEND}/missing-blobs`, {
    method: "post",
    body: JSON.stringify({
      pds_host: PDS_HOSTNAME,
      handle: new_handle,
      password: "<<new_password>>",
    }),
  });

  // export blobs
  fetch(`${MIGRATOR_BACKEND}/export-blobs`, {
    method: "post",
    body: JSON.stringify({
      new_pds_host: PDS_HOSTNAME,
      new_handle: new_handle,
      new_password: "<<new_password>>",
      old_pds_host: old_pds,
      old_handle: old_handle,
      old_password: "<<old_password>>",
    }),
  });

  // upload blobs
  fetch(`${MIGRATOR_BACKEND}/upload-blobs`, {
    method: "post",
    body: JSON.stringify({
      pds_host: PDS_HOSTNAME,
      handle: new_handle,
      password: "<<new_password>>",
    }),
  });

  // migrate preferences
  fetch(`${MIGRATOR_BACKEND}/migrate-preferences`, {
    method: "post",
    body: JSON.stringify({
      new_pds_host: PDS_HOSTNAME,
      new_handle: new_handle,
      new_password: "<<new_password>>",
      old_pds_host: old_pds,
      old_handle: old_handle,
      old_password: "<<old_password>>",
    }),
  });

  // req PLC token
  fetch(`${MIGRATOR_BACKEND}/request-token`, {
    method: "post",
    body: JSON.stringify({
      pds_host: old_pds,
      handle: old_handle,
      password: "<<old_password>>",
    }),
  });

  return {
    ok: true,
  };
}

export default function Migrate({ loaderData }: Route.ComponentProps) {
  const fetcher = useFetcher();

  return (
    <fetcher.Form>
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
        <img alt="A clock by artist Katie Tightpussy" src={clock_art} />
        <Progress.Root width="100%" striped value={null}>
          <Progress.Track>
            <Progress.Range />
          </Progress.Track>
        </Progress.Root>
      </VStack>
    </fetcher.Form>
  );
}
