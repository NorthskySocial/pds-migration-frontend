import { Heading, Highlight, Text, Input, Button, VStack, HStack, Grid } from "@chakra-ui/react";
import { Field } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import type { ScreenProps } from "~/util/stages";
import { useFetcher } from "react-router";

export default function OriginLoginScreen({ state }: ScreenProps) {
  const fetcher = useFetcher();
  const isMissingBlobsJourney = state.do_journey === "missing-blobs";
  const hasOriginPds = Boolean(state.handle_origin && state.pds_origin);
  const submitValue = isMissingBlobsJourney ? "missing-blobs-login" : "resume-migration-login";

  return (
    <fetcher.Form method="post" style={{ width: "100%" }}>
      <VStack mb="5" width="100%">
        <Heading size="3xl" letterSpacing="tight" textAlign="center">
          <Highlight query="to Bluesky">Login to both services</Highlight>
        </Heading>
        {hasOriginPds ? (
          <>
            <Text textAlign="center">Handle: {state.handle_origin}</Text>
            <Text textAlign="center">Detected PDS: {state.pds_origin}</Text>
            {state.require_2fa_code ? (
              <>
                <Text fontSize="md" textAlign="justify">
                  Please check your email for a 2FA code and enter it below
                </Text>
                <Field required label="Email 2FA code">
                  <Input name="2fa_code" required />
                </Field>
              </>
            ) : (
              <>
                <Text fontSize="md" textAlign="justify">
                  {isMissingBlobsJourney
                    ? "Please provide us with the following information so we can recover any missing blobs from your previous PDS."
                    : "Please provide us with the following information so we can resume migrating your data."}
                </Text>
                <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap="6" width="100%">
                  <VStack>
                    <Field required label="Account password">
                      <PasswordInput autoComplete="password" name="bsky-password" />
                    </Field>
                    <Text>
                      ⚠️ Do not use an app password. An app password usually looks like this:
                      xxxx-xxxx-xxxx-xxxx.
                    </Text>
                  </VStack>
                  <VStack>
                    <Field required label="Northsky login">
                      <Input
                        autoComplete="username"
                        name="northsky-handle"
                        placeholder="username.northsky.social"
                      />
                    </Field>
                    <Field required label="Northsky password">
                      <PasswordInput autoComplete="password" name="northsky-password" />
                    </Field>
                  </VStack>
                </Grid>
              </>
            )}
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
        <HStack>
          <Button name="cancel" type="submit" value="cancel" formNoValidate>
            Cancel
          </Button>
          <Button
            type="submit"
            name="submit"
            margin="0 auto"
            value={hasOriginPds ? submitValue : "find-pds"}
          >
            {hasOriginPds ? "Continue" : "Find PDS"}
          </Button>
        </HStack>
      </VStack>
    </fetcher.Form>
  );
}
