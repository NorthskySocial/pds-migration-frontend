import {
  Heading,
  Highlight,
  Text,
  Button,
  Image,
  VStack,
  HStack,
} from "@chakra-ui/react";
import { Field } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import plc_screenshot from "../assets/plc_update.png";
import type { ScreenProps } from "~/util/stages";
import { useFetcher } from "react-router";

export default function ValidatePLCTokenScreen({ state }: ScreenProps) {
  const fetcher = useFetcher();
  return (
    <fetcher.Form method="post">
      <VStack mb="5">
        <Heading size="3xl" letterSpacing="tight">
          <Highlight query="to Bluesky">Check Your Email</Highlight>
        </Heading>
        <Text fontSize="md" textAlign={"left"}>
          Bluesky should have just sent you an e-mail to your inbox. Input that
          code below to continue migration.
        </Text>
        <img src={plc_screenshot} />
        <Field required label="PLC Token">
          <PasswordInput name="token_plc" />
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
