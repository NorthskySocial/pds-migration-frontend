import { Heading, Highlight, Text, Input, Button } from "@chakra-ui/react";
import { Field } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { Switch } from "@/components/ui/switch";
import type { ScreenProps } from "~/util/types";
import { useState } from "react";
import { useFetcher } from "react-router";

export default function OriginLoginScreen({ state }: ScreenProps) {
  const [altPds, setAltPds] = useState(false);
  const fetcher = useFetcher();
  return (
    <>
      <Heading size="3xl" letterSpacing="tight" textAlign={"center"}>
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
        colorPalette={"purple"}
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
    </>
  );
}
