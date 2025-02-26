import { useState } from "react";
import type { Route } from "./+types/new-account";
import {
  Heading,
  Highlight,
  Text,
  Input,
  Button,
  Spinner,
} from "@chakra-ui/react";
import { Field } from "~/components/ui/field";
import { InputGroup } from "~/components/ui/input-group";
import {
  PasswordInput,
  PasswordStrengthMeter,
} from "~/components/ui/password-input";
import { passwordStrength } from "check-password-strength";
import { redirect, useFetcher } from "react-router";
import { getSession, commitSession } from "../sessions.server";

const { MIGRATOR_BACKEND, PDS_HOSTNAME } = import.meta.env;

export function loader() {
  return { name: "northsky.social" };
}

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const data = await request.formData();
  const pw = (data.get("password") as string) ?? "";
  const pwConfirm = (data.get("password-confirm") as string) ?? "";
  const handle_new = ((data.get("handle") as string) ?? "").toLowerCase();
  const submitted = data.has("submit");
  const did = session.get("did");

  let res = {
    ok: true,
    handle: handle_new,
    error_password_match: "",
    error_password_length: "",
    handle_available: null as null | boolean,
  };

  if (pw !== pwConfirm && pw.length && pwConfirm.length) {
    res = {
      ...res,
      ok: false,
      error_password_match: "Passwords do not match",
    };
  }

  if (pw?.length < 8 && pw.length > 0) {
    res = {
      ...res,
      ok: false,
      error_password_length: "Password must be at least 8 characters",
    };
  }

  if (handle_new.length > 0) {
    const handle_available = await fetch(
      `${PDS_HOSTNAME}/xrpc/com.atproto.identity.resolveHandle?handle=${handle_new}`
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
    session.set("userId_new", handle_new);

    const token = session.get("serviceToken");

    if (!token) {
      session.flash("error", "Invalid service token");

      // Redirect back to the login page with errors.
      return redirect("/connect-bluesky", {
        headers: {
          "Set-Cookie": await commitSession(session),
        },
      });
    }

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

    const createAccountRes = await fetch(`${MIGRATOR_BACKEND}/create-account`, {
      method: "post",
      body: JSON.stringify({
        pds_host: PDS_HOSTNAME,
        handle: handle_new,
        password: pw,
        email,
        token,
        did,
        invite_code: inviteCode,
      }),
    });

    if (!createAccountRes.ok) {
      const { message } = await createAccountRes.json<{ message: string }>();

      session.flash("error", message);

      // Redirect back to the login page with errors.
      return redirect("/", {
        headers: {
          "Set-Cookie": await commitSession(session),
        },
      });
    }

    // GET USER TOKEN BY LOGGING IN HERE
    session.set("newPdsUserToken", "TOKEN");

    return redirect("/migrate", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }

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
        Bluesky should have just sent you an e-mail to your inbox. Input that
        code below to continue migration.
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
