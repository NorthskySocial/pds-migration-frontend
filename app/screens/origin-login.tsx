import { Heading, Highlight, Text, Input, Button, VStack, HStack } from "@chakra-ui/react";
import { Field } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import type { ScreenProps } from "~/util/stages";
import { useFetcher } from "react-router";

export default function OriginLoginScreen({ state }: ScreenProps) {
  const fetcher = useFetcher();
  const hasOriginPds = Boolean(state.handle_origin && state.pds_origin);
  return (
    <fetcher.Form method="post" style={{ width: "100%" }}>
      <VStack mb="5" width="100%">
        <Heading size="3xl" letterSpacing="tight" textAlign={"center"}>
          <Highlight query="to your account">Login to your account</Highlight>
        </Heading>
        {hasOriginPds ? (
          <>
            <Text textAlign="center">Handle: {state.handle_origin}</Text>
            <Text textAlign="center">Detected PDS: {state.pds_origin}</Text>
          </>
        ) : (
          <>
            <Text fontSize="md" textAlign="center">
              Enter your current handle so we can find where your account is hosted.
            </Text>
            <Field required label="Current handle">
              <Input
                autoComplete="username"
                name="bsky-handle"
                defaultValue={state.handle_origin}
                placeholder="username.bsky.social"
                required
              />
            </Field>
          </>
        )}
        {hasOriginPds && state.require_2fa_code ? (
          <>
            <Text fontSize="md" textAlign={"justify"}>
              Please check your email for a 2FA code and enter it below
            </Text>
            <Field required label="Email 2FA code">
              <Input name="2fa_code" required />
            </Field>
          </>
        ) : hasOriginPds ? (
          <>
            <Text fontSize="md" textAlign={"justify"}>
              Please provide us with the following information so we can migrate your data. Your PDS
              may e-mail you as part of this process, so{" "}
              <strong>ensure your e-mail address is verified</strong> before starting migration.
            </Text>
            <Field required label="Account password">
              <PasswordInput autoComplete="password" name="bsky-password" />
            </Field>
            <Text>
              ⚠️ Do not use an app password. An app password usually looks like this:
              xxxx-xxxx-xxxx-xxxx.
            </Text>
          </>
        ) : null}
        <HStack>
          <Button name="cancel" type="submit" value={"cancel"} formNoValidate>
            Cancel
          </Button>
          <Button
            type="submit"
            name="submit"
            value={hasOriginPds ? "origin-login" : "find-pds"}
            margin={"0 auto"}
          >
            {hasOriginPds ? "Continue" : "Find PDS"}
          </Button>
        </HStack>
      </VStack>
    </fetcher.Form>
  );
}
