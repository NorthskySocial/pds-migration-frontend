import type { Route } from "./+types/bluesky-login";
import { Heading, Highlight, Text, Input, Button } from "@chakra-ui/react";
import { Field } from "~/components/ui/field";
import { PasswordInput } from "~/components/ui/password-input";
import { redirect } from "react-router";
import { AtpAgent } from "@atproto/api";
import { getSession, commitSession } from "../sessions.server";
import {
  getPdsEndpoint,
  isValidDidDoc,
  type DidDocument,
} from "@atproto/common-web";

const { MIGRATOR_BACKEND, PDS_HOSTNAME } = import.meta.env;

export function loader() {
  return { name: "northsky.social" };
}

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const form = await request.formData();
  const handle_old = form.get("bsky-handle") as string | null;
  const password = form.get("bsky-password") as string | null;

  const { did } = await (
    await fetch(
      `${PDS_HOSTNAME}/xrpc/com.atproto.identity.resolveHandle?handle=${handle_old}`
    )
  ).json<{ did: string }>();

  if (!did || !handle_old) {
    session.flash("error", "Invalid handle");

    // Redirect back to the login page with errors.
    return redirect("/connect-bluesky", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }

  session.set("did", did);

  const didDoc: DidDocument = await (
    await fetch(`https://plc.directory/${did}`)
  ).json();

  if (!didDoc || !isValidDidDoc(didDoc)) {
    session.flash("error", "PLC Directory unavailable; please try later.");

    // Redirect back to the login page with errors.
    return redirect("/connect-bluesky", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }

  const serviceEndpoint = getPdsEndpoint(didDoc);

  session.set("old_pds", serviceEndpoint);

  const agent = new AtpAgent({ service: serviceEndpoint! });

  const { data } = await agent.login({
    identifier: handle_old,
    password: password!,
  });

  const { email } = data;

  session.set("email", email);

  const { token } = await (
    await fetch(`${MIGRATOR_BACKEND}/service-auth`, {
      method: "post",
      body: JSON.stringify({
        pds_host: serviceEndpoint,
        handle: handle_old,
        password,
        aud: `did:web:${PDS_HOSTNAME.replace(/https?:\/\//i, "")}`,
      }),
    })
  ).json<{ token: string }>();

  if (!token) {
    session.flash(
      "error",
      "Invalid service token received; please contact support."
    );

    // Redirect back to the login page with errors.
    return redirect("/connect-bluesky", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }

  session.set("serviceToken", token);
  session.set("userId_old", handle_old);

  // Login succeeded, send them to the home page.
  return redirect("/new-account", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

export default function BlueskyConnect() {
  return (
    <>
      <Heading size="3xl" letterSpacing="tight">
        <Highlight query="to Bluesky">Login to Bluesky</Highlight>
      </Heading>
      <Text fontSize="md" textAlign={"center"}>
        Please provide us with the following information so we can migrate your
        data.
      </Text>
      <Text fontSize="md" textAlign={"center"}>
        Bluesky will e-mail you as part of this process, so{" "}
        <strong>ensure your e-mail address is verified</strong> before starting
        migration.
      </Text>
      <Field required label="Bluesky login">
        <Input name="bsky-handle" placeholder="username.bsky.social" />
      </Field>
      <Field required label="Bluesky password">
        <PasswordInput name="bsky-password" />
      </Field>
      <Button name="submit" type="submit">
        Continue
      </Button>
    </>
  );
}
