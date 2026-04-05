import {
  Heading,
  Highlight,
  Text,
  Input,
  Button,
  VStack,
  HStack,
} from "@chakra-ui/react";
import { Field } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import type { ScreenProps } from "~/util/stages";
import { useFetcher } from "react-router";

export default function MissingBlobsLoginScreen({ state }: ScreenProps) {
  const fetcher = useFetcher();
  return (
    <fetcher.Form method="post" style={{ width: "100%" }}>
      <VStack mb="5" width="100%">
        <Heading size="3xl" letterSpacing="tight" textAlign={"center"}>
          <Highlight query="to Northsky">Login to Northsky</Highlight>
        </Heading>
        <Text fontSize="md" textAlign={"justify"}>
          Please provide your Northsky credentials so we can recover any missing
          blobs from your previous PDS.
        </Text>
        <Field required label="Northsky login (handle)">
          <Input
            autoComplete="username"
            name="northsky-handle"
            placeholder="username.northsky.social"
            onChange={(e) => {
              e.target.value = e.target.value.trim();
            }}
          />
        </Field>
        <Field required label="Northsky password">
          <PasswordInput autoComplete="password" name="northsky-password" />
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
