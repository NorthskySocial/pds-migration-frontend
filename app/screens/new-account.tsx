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
import type { ScreenProps } from "~/util/stages";
import { useFetcher } from "react-router";
import { useState } from "react";
import { passwordStrength } from "check-password-strength";

export default function NewAccountScreen({ state }: ScreenProps) {
  const fetcher = useFetcher();
  const [pass, setPass] = useState("");
  const [passVerify, setPassVerify] = useState("");
  const { id: strength } = passwordStrength(pass);
  return (
    <fetcher.Form method="post">
      <Heading size="3xl" textAlign={"center"} letterSpacing="tight">
        <Highlight query="New Account">
          {state.do_journey === "create"
            ? "Create New Account"
            : "Reserve New Account"}
        </Highlight>
      </Heading>
      {state.do_journey === "migrate" ? (
        <Text fontSize="md" textAlign={"center"}>
          We'll need to give to a <strong>.northsky.social</strong> handle as
          part of the migration. If you have a custom domain handle, you can
          change it back right after the migration process is over.
        </Text>
      ) : (
        <Text fontSize="md" textAlign={"center"}>
          You get a .northsky.social handle to get you started. If you want to
          use a custom domain handle, you can set that later.
        </Text>
      )}
      {!state.email && (
        <Field
          required
          invalid={fetcher.data?.error_password_length}
          label="Email address"
          errorText={fetcher.data?.error_password_length}
        >
          <Input name="email" required placeholder="user@example.com" />
        </Field>
      )}
      <br />
      <Field
        label="New handle"
        required
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
          autoComplete="new-password"
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
          autoComplete="new-password"
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
