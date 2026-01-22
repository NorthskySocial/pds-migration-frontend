import { Heading, Text, VStack } from "@chakra-ui/react";
import melted_clock from "../assets/melted.jpg";
import type { ScreenProps } from "~/util/stages";

export default function FailedMigrationScreen({ state }: ScreenProps) {
  return (
    <>
      <VStack mb="5" width="100%">
        <Heading size="3xl" letterSpacing="tight">
          Migration failed
        </Heading>
        <Text fontSize="md" textAlign={"justify"}>
          An unexpected error has occurred while migrating your data.
        </Text>
        <img
          alt="Image of melting clocks by artist Katie Tightpussy"
          src={melted_clock}
          style={{ maxWidth: "100%", height: "auto" }}
        />
        <Text fontSize="md" textAlign={"justify"}>
          Please reach out to our support team,{" "}
          <a href="mailto:support@northsky.social">support@northsky.social</a>.
        </Text>
      </VStack>
    </>
  );
}
