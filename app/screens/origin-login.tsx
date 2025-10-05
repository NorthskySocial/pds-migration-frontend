import {
  Heading,
  Highlight,
  Text,
  Input,
  Button,
  Image,
  VStack,
  HStack,
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
          <Highlight query="to Bluesky">Login to Bluesky</Highlight>
        </Heading>
        <Text fontSize="md" textAlign={"justify"}>
          Please provide us with the following information so we can migrate
          your data. Bluesky will e-mail you as part of this process, so{" "}
          <strong>ensure your e-mail address is verified</strong> before
          starting migration.
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
            <Input name="pds" defaultValue="https://bsky.social" />
          </Field>
        )}
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
