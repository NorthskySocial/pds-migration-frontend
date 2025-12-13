import {
  Heading,
  Highlight,
  Text,
  Input,
  Button,
  Spinner,
  VStack,
  HStack,
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
import { useDebouncedCallback } from "use-debounce";

export default function NewAccountScreen({ state }: ScreenProps) {
  const fetcher = useFetcher();
  const [pass, setPass] = useState("");
  const [passVerify, setPassVerify] = useState("");
  const { id: strength } = passwordStrength(pass);
  const onChangeCallback = useDebouncedCallback(
    (event) => {
      if (event.target.willValidate) {
        fetcher.submit(event.target.form);
      }
    },
    200,
    { trailing: true }
  );
  return (
    <fetcher.Form method="post">
      <VStack mb="5">
        <Heading size="3xl" textAlign={"center"} letterSpacing="tight">
          <Highlight query="New Account">
            {state.do_journey === "create"
              ? "Create New Account"
              : "Reserve New Account"}
          </Highlight>
        </Heading>
        {state.do_journey === "migrate" ? (
          <Text fontSize="md" textAlign={"justify"}>
            If you are currently using a custom domain handle, you can continue
            to do so by entering it as your handle for your Northsky account. If you are currently
            using a <strong>.bsky.social</strong> handle, you will need to switch to a
            <strong>.northsky.social</strong> handle as part of the migration.
          </Text>
        ) : (
          <Text fontSize="md" textAlign={"justify"}>
            You get a <strong>.northsky.social</strong> handle to get you started.
            If you want to use a custom domain handle, you can set that later.
          </Text>
        )}
        {!state.email && (
          <Field required label="Email address">
            <Input name="email" required placeholder="user@example.com" />
          </Field>
        )}
        <br />
        <Field
          label="New handle"
          invalid={
            state.handle_not_available === true &&
            (state.handle_dest?.length ?? 0) > 0
          }
          errorText={
            state.handle_not_available === true &&
            (state.handle_dest?.length ?? 0) > 0 &&
            `Uh oh! ${state.handle_dest?.toLowerCase()} is not available!`
          }
          helperText={
            state.handle_not_available === false &&
            (state.handle_dest?.length ?? 0) > 0 &&
            `Congrats! 🎉 ${state.handle_dest?.toLowerCase()} is available!` ||
            (state.do_journey === "migrate" && "Choose a handle that ends with .northsky.social (e.g., user.northsky.social) or use a custom domain that you own (e.g., example.com)") ||
            (state.do_journey === "create" && "Choose a handle that ends with .northsky.social (e.g., user.northsky.social)")
          }
        >
          <InputGroup
            width="100%"
            startElement="@"
            endElement={state.do_journey === "create" ? ".northsky.social" : undefined}
          >
            <Input
              name="handle"
              onKeyDown={(event) => {
                // NOTE: we only allow dots (.) on migration since custom domains are allowed there
                const regexPattern = state.do_journey === "create"
                  ? /^[a-z0-9-]$/i
                  : /^[a-z0-9.-]$/i;
                if (!regexPattern.test(event.key)) {
                  return event.preventDefault();
                }
              }}
              onChange={onChangeCallback}
              placeholder={state.do_journey === "create" ? "username" : "username or custom domain"}
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
          invalid={!!state.password_too_short}
          errorText={state.password_too_short && `Password is too short!`}
          label="Password"
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
            state.password_mismatch ||
            (pass !== passVerify && passVerify.length > 0)
          }
          errorText={"Passwords do not match"}
        >
          <PasswordInput
            name="password-repeat"
            autoComplete="new-password"
            onChange={(e) => setPassVerify(e.target.value)}
            value={passVerify}
          />
        </Field>
        <br />
        <HStack>
          <Button type="submit" name="submit" margin={"0 auto"}>
            Continue
          </Button>
          <Button name="cancel" type="submit" value={"cancel"} formNoValidate>
            Cancel
          </Button>
        </HStack>
      </VStack>
    </fetcher.Form>
  );
}
