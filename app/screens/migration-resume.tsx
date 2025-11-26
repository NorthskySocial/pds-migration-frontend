import {
  Heading,
  Highlight,
  Text,
  Input,
  Button,
  VStack,
  HStack,
  Grid,
  Box,
} from "@chakra-ui/react";
import { Field } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { Switch } from "@/components/ui/switch";
import type { ScreenProps } from "~/util/stages";
import { useState } from "react";
import { useFetcher } from "react-router";

export default function OriginLoginScreen({ state }: ScreenProps) {
  const [altPds, setAltPds] = useState(false);
  const fetcher = useFetcher();
  return (
    <fetcher.Form method="post">
      <VStack mb="5">
        <Heading size="3xl" letterSpacing="tight" textAlign={"center"}>
          <Highlight query="to Bluesky">Login to both services</Highlight>
        </Heading>
        {state.require_2fa_code ? (
          <>
            <Text fontSize="md" textAlign={"justify"}>
              Please check your email for a 2FA code and enter it below
            </Text>
            <Field required label="Email 2fa code">
              <Input name="2fa_code" required />
            </Field>
          </>
        ) : (
          <>
            <Text fontSize="md" textAlign={"justify"}>
              Please provide us with the following information so we can resume
              migrating your data.
            </Text>
            <Grid templateColumns="repeat(2, 1fr)" gap="6">
              <VStack>
                <Switch
                  name="has-pds"
                  checked={altPds}
                  onCheckedChange={() => setAltPds(!altPds)}
                >
                  Non-Bluesky PDS?
                </Switch>
                {altPds && (
                  <Field required label="Your PDS">
                    <Input name="pds" defaultValue="https://bsky.social" />
                  </Field>
                )}
              </VStack>
              <Box></Box>
              <VStack>
                <Field required label="Bluesky login">
                  <Input
                    autoComplete="username"
                    name="bsky-handle"
                    placeholder="username.bsky.social"
                  />
                </Field>
                <Field required label="Bluesky password">
                  <PasswordInput autoComplete="password" name="bsky-password" />
                </Field>
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
                  <PasswordInput
                    autoComplete="password"
                    name="northsky-password"
                  />
                </Field>
              </VStack>
            </Grid>
          </>
        )}
        <HStack>
          <Button
            type="submit"
            name="submit"
            margin={"0 auto"}
            value="resume-migration-login"
          >
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
