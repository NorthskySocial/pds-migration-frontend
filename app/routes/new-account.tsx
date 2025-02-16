import { useState } from "react";
import type { Route } from "./+types/home";
import {
  Heading,
  Highlight,
  Text,
  Input,
  Button,
  Spinner,
  HStack,
} from "@chakra-ui/react";
import { Field } from "~/components/ui/field";
import { InputGroup } from "~/components/ui/input-group";
import {
  PasswordInput,
  PasswordStrengthMeter,
} from "~/components/ui/password-input";
import { passwordStrength } from "check-password-strength";
import {
  redirect,
  useFetcher,
  type ClientActionFunctionArgs,
} from "react-router";

export function loader() {
  return { name: "northwoods.social" };
}

export async function clientAction({ request }: ClientActionFunctionArgs) {
  const data = await request.formData();
  const pw = (data.get("password") as string) ?? "";
  const pwConfirm = (data.get("password-confirm") as string) ?? "";
  const handle = ((data.get("handle") as string) ?? "").toLowerCase();
  const submitted = data.has("submit");

  // await new Promise((res) => setTimeout(res, 1000)); // Uncomment to demo loading state

  let res = {
    ok: true,
    handle,
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

  // @TODO check handle availability
  if (handle.length > 0) {
    res = {
      ...res,
      handle_available: true,
    };
  }

  console.log(submitted, res);
  if (submitted && res.ok) {
    return redirect("/connect-bluesky");
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
      <Heading size="3xl" letterSpacing="tight">
        <Highlight query="New Account">Reserve New Account</Highlight>
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
          `Congrats! 🎉 ${fetcher.data?.handle.toLowerCase()}.northwoods.social is available!`
        }
      >
        <InputGroup
          width="100%"
          startElement="@"
          endElement={".northwoods.social"}
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
