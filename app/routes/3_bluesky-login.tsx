import type { Route } from "./+types/3_bluesky-login";
import { Heading, Highlight, Text, Input, Button } from "@chakra-ui/react";
import { Field } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { redirect, data as dataRes, useFetcher } from "react-router";
import { AtpAgent } from "@atproto/api";
import { getSession, commitSession } from "../sessions.server";
import {
  getPdsEndpoint,
  isValidDidDoc,
  type DidDocument,
} from "@atproto/common-web";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  return dataRes(
    { error: session.get("error") },
    {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    }
  );
}

export async function action({ request, context }: Route.ActionArgs) {
  console.log("PAGE 3");
  const session = await getSession(request.headers.get("Cookie"));
  const form = await request.formData();
  const handle_origin = form.get("bsky-handle") as string | null;
  const password = form.get("bsky-password") as string | null;
  const pds_origin = (form.get("pds") as string) ?? "https://bsky.app";
  const plc_hostname = session.get("plc_hostname");
  const pds_dest = session.get("pds_dest") as string;
  console.log(pds_origin);
  const origin_agent = new AtpAgent({ service: pds_origin });

  const { data: agentSessionData } = await origin_agent.login({
    identifier: handle_origin!,
    password: password!,
  });

  try {
    const { did } = await (
      await fetch(
        `${pds_origin}/xrpc/com.atproto.identity.resolveHandle?handle=${handle_origin}`
      )
    ).json<{ did: string }>();

    if (!did || !handle_origin) {
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
      await fetch(`${plc_hostname}/${did}`)
    ).json();

    console.log(didDoc);

    if (!didDoc || !isValidDidDoc(didDoc)) {
      // This might need rewriting
      session.flash("error", "PLC Directory unavailable; please try later.");

      // Redirect back to the login page with errors.
      return redirect("/connect-bluesky", {
        headers: {
          "Set-Cookie": await commitSession(session),
        },
      });
    }

    const serviceEndpoint = getPdsEndpoint(didDoc) ?? pds_origin;

    session.set("pds_origin", serviceEndpoint);

    const { email, accessJwt: token_origin } = agentSessionData;
    session.set("email", email!); // ???
    session.set("token_origin", token_origin);
    console.log("service endpoint", serviceEndpoint);

    const pds_dest_uri = new URL(pds_dest);
    const aud = `did:web:${pds_dest_uri.host.replace(/:\d+/, "")}`;
    console.log(aud);
    const res = await fetch(`${context.MIGRATOR_BACKEND}/service-auth`, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "post",
      body: JSON.stringify({
        pds_host: serviceEndpoint,
        did,
        token: token_origin,
        aud,
      }),
    });

    if (!res.ok) {
      console.error(res.statusText);
      session.flash(
        "error",
        `Invalid service token received; please contact support with error: ${res.statusText}`
      );

      // Redirect back to the login page with errors.
      return redirect("/connect-bluesky", {
        headers: {
          "Set-Cookie": await commitSession(session),
        },
      });
    }

    const token = await res.text();

    session.set("token_service", token);
    session.set("handle_origin", handle_origin);

    // Login succeeded, send them to the home page.
    return redirect("/new-account", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  } catch (e) {
    console.error(e);
    session.flash("error", (e as Error).message ?? "Unknown error");

    return redirect("/new-account", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }
}

export default function BlueskyConnect({ loaderData }: Route.ComponentProps) {
  const { error } = loaderData;
  const fetcher = useFetcher();
  const [altPds, setAltPds] = useState(false);
  return (
    <fetcher.Form method="post">
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
      <Switch
        name="has-pds"
        checked={altPds}
        onCheckedChange={() => setAltPds(!altPds)}
      >
        Non-Bluesky PDS?
      </Switch>
      {altPds && (
        <Field required label="Your PDS">
          <Input name="pds" defaultValue="https://bsky.app" />
        </Field>
      )}
      <Field required label="Bluesky login">
        <Input name="bsky-handle" placeholder="username.bsky.social" />
      </Field>
      <Field required label="Bluesky password">
        <PasswordInput name="bsky-password" />
      </Field>
      <Button name="submit" type="submit">
        Continue
      </Button>
      {error && <div>{error}</div>}
    </fetcher.Form>
  );
}
