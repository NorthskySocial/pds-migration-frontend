import {
  Heading,
  Highlight,
  Text,
  Button,
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
    <fetcher.Form method="post" style={{ width: "100%" }}>
      <VStack mb="5" width="100%">
        <Heading size="3xl" letterSpacing="tight">
          <Highlight query="to Bluesky">Check Your Email</Highlight>
        </Heading>
        <Text fontSize="md" textAlign={"left"}>
          Bluesky should have just sent you an e-mail to your inbox. Input that
          code below to continue migration. If you do not receive an e-mail within a
          few minutes, please check your spam folder or click "Resend Code".
        </Text>
        <img src={plc_screenshot} style={{ maxWidth: "100%", height: "auto" }} />
        <Field required label="PLC Token">
          <PasswordInput name="token_plc" />
        </Field>

        <HStack>
          <Button
            type="submit"
            name="submit"
            margin={"0 auto"}
            disabled={fetcher.state !== "idle"}
          >
            {fetcher.state !== "idle" ? "Processing..." : "Continue"}
          </Button>
          <Button
            name="resend_plc_token"
            type="submit"
            value="resend"
            formNoValidate
            disabled={fetcher.state !== "idle"}
          >
            Resend Code
          </Button>
          <Button
            name="cancel"
            type="submit"
            value={"cancel"}
            formNoValidate
            disabled={fetcher.state !== "idle"}
          >
            Cancel
          </Button>
        </HStack>
      </VStack>
    </fetcher.Form>
  );
}
