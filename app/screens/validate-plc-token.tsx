import { Heading, Highlight, Text, Button } from "@chakra-ui/react";
import { Field } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import plc_screenshot from "../assets/plc_update.png";
import type { ScreenProps } from "~/util/types";

export default function ValidatePLCTokenScreen({
  state,
  fetcher,
}: ScreenProps) {
  return (
    <>
      <Heading size="3xl" letterSpacing="tight">
        <Highlight query="to Bluesky">Check Your Email</Highlight>
      </Heading>
      <Text fontSize="md" textAlign={"center"}>
        Bluesky should have just sent you an e-mail to your inbox. Input that
        code below to continue migration.
      </Text>
      <img src={plc_screenshot} />
      <Field required label="PLC Token">
        <PasswordInput name="plc-token" />
      </Field>
      <Button name="submit" type="submit">
        Migrate!
      </Button>
    </>
  );
}
