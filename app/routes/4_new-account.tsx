import { useState } from "react";
import type { Route } from "./+types/4_new-account";
import {
  Heading,
  Highlight,
  Text,
  Input,
  Button,
  Spinner,
} from "@chakra-ui/react";
import { Field } from "@/components/ui/field";
import { InputGroup } from "@/components/ui/input-group";
import {
  PasswordInput,
  PasswordStrengthMeter,
} from "@/components/ui/password-input";
import { passwordStrength } from "check-password-strength";
import { data, redirect, useFetcher } from "react-router";
import { getSession, commitSession } from "../sessions.server";
import { AtpAgent } from "@atproto/api";

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
  console.log("PAGE 4");
  const { VITE_MIGRATOR_BACKEND = "http://localhost:9090" } = import.meta.env;
  const session = await getSession(request.headers.get("Cookie"));
  const data = await request.formData();
  const pw_dest = (data.get("password") as string) ?? "";
  const pwConfirm = (data.get("password-confirm") as string) ?? "";
  const handle = ((data.get("handle") as string) ?? "").toLowerCase();
  const submitted = data.has("submit");
  const did = session.get("did") as string;
  const service_token = session.get("token_service") as string;
  const pds_dest = session.get("pds_dest") as string;
  const dest_hostname = pds_dest.replace(/https?:\/\//, "");
  const handle_dest = `${handle}.${dest_hostname}`;

  let res = {
    ok: true,
    handle: `${handle}.${dest_hostname}`,
    error_password_match: "",
    error_password_length: "",
    handle_available: null as null | boolean,
  };

  // Check passwords matching
  if (pw_dest !== pwConfirm && pw_dest.length && pwConfirm.length) {
    res = {
      ...res,
      ok: false,
      error_password_match: "Passwords do not match",
    };
  }

  // Check password length
  if (pw_dest?.length < 8 && pw_dest.length > 0) {
    res = {
      ...res,
      ok: false,
      error_password_length: "Password must be at least 8 characters",
    };
  }

  // Check handle availability
  if (handle.length > 0) {
    const handle_available = await fetch(
      `${pds_dest}/xrpc/com.atproto.identity.resolveHandle?handle=${handle_dest}`
    )
      .then<{ message: string; error: string } & { did: string }>((r) =>
        r.json()
      )
      .then((d) => d.message === "Unable to resolve handle" || d.did === did);

    res = {
      ...res,
      handle_available,
    };
  }

  if (submitted && res.ok) {
    session.set("handle_dest", handle_dest);

    const inviteCode = session.get("inviteCode");

    if (!inviteCode) {
      session.flash("error", "Invalid invite code");

      // Redirect back to the login page with errors.
      return redirect("/", {
        headers: {
          "Set-Cookie": await commitSession(session),
        },
      });
    }

    const email = session.get("email");
    console.log(
      email,
      handle_dest,
      service_token,
      pw_dest,
      email,
      did,
      inviteCode
    );

    const createAccountRes = await fetch(
      `${VITE_MIGRATOR_BACKEND}/create-account`,
      {
        method: "post",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pds_host: pds_dest,
          handle: handle_dest,
          token: service_token,
          password: pw_dest,
          email,
          did,
          invite_code: inviteCode,
        }),
      }
    );
    console.log("wheee", createAccountRes);

    if (!createAccountRes.ok) {
      const message = createAccountRes.statusText;

      session.flash("error", message);

      // Redirect back to the login page with errors.
      return redirect("/", {
        headers: {
          "Set-Cookie": await commitSession(session),
        },
      });
    }

    // Get new user token
    const agent_dest = new AtpAgent({ service: pds_dest });

    const { data } = await agent_dest.login({
      identifier: handle_dest,
      password: pw_dest,
    });

    session.set("token_dest", data.accessJwt);

    // All good! Go to migrator!
    return redirect("/migrate", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }

  // this doesn't seem right...
  return res;
}

export default function NewAccount() {
  const [pass, setPass] = useState("");
  const [passVerify, setPassVerify] = useState("");
  const { id: strength } = passwordStrength(pass);
  const fetcher = useFetcher();

  return (
    <fetcher.Form method="post">
      <Heading size="3xl" textAlign={"center"} letterSpacing="tight">
        <Highlight
          styles={{ bg: "secondary", color: "brand.bg" }}
          query="New Account"
        >
          Reserve New Account
        </Highlight>
      </Heading>
      <Text fontSize="md" textAlign={"center"}>
        We'll need to give to a .northsky.social handle as part of the
        migration. If you have a custom domain handle, you can change it back
        right after the migration process is over.
      </Text>
      <br />

      <Field
        label="New handle"
        invalid={fetcher.data && !fetcher.data?.handle_available}
        errorText={!fetcher.data?.ok && fetcher.data?.handle_available}
        helperText={
          fetcher.data?.handle_available &&
          `Congrats! 🎉 ${fetcher.data?.handle.toLowerCase()}.northsky.social is available!`
        }
      >
        <InputGroup
          width="100%"
          startElement="@"
          endElement={".northsky.social"}
        >
          <Input
            name="handle"
            onKeyDown={(event) => {
              if (!/[a-z0-9]/i.test(event.key)) {
                return event.preventDefault();
              }
            }}
            onChange={(event) => {
              if (event.currentTarget.willValidate) {
                fetcher.submit(event.currentTarget.form);
              }
            }}
            placeholder="username"
          />
        </InputGroup>
        <div>
          {fetcher.state !== "idle" ? (
            <Spinner />
          ) : (
            fetcher.data?.handle_message
          )}
        </div>
      </Field>
      <br />
      <Field
        required
        invalid={fetcher.data?.error_password_length}
        label="Password"
        errorText={fetcher.data?.error_password_length}
      >
        <PasswordInput
          name="password"
          onChange={(e) => setPass(e.target.value)}
          value={pass}
        />
        <PasswordStrengthMeter
          width="100%"
          value={pass.length > 0 ? strength + 1 : 0}
        />
      </Field>
      <Field
        required
        label="Repeat password"
        invalid={
          fetcher.data?.error_password_match ||
          (pass !== passVerify && passVerify.length > 0)
        }
        errorText={fetcher.data?.error_password_match}
      >
        <PasswordInput
          name="password-repeat"
          onChange={(e) => setPassVerify(e.target.value)}
          value={passVerify}
        />
      </Field>
      <br />
      <Button name="submit" type="submit">
        Continue
      </Button>
    </fetcher.Form>
  );
}
