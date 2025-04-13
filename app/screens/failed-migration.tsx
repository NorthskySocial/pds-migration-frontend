import { Heading, Text } from "@chakra-ui/react";
import melted_clock from "../assets/melted.jpg";
import type { ScreenProps } from "~/util/types";

export default function FailedMigrationScreen({ state }: ScreenProps) {
  return (
    <>
      <Heading size="3xl" letterSpacing="tight">
        Migration failed
      </Heading>
      <Text fontSize="md" textAlign={"center"}>
        An unexpected error has occurred while migrating your data.
      </Text>
      <img
        alt="Image of melting clocks by artist Katie Tightpussy"
        src={melted_clock}
      />
      <Text fontSize="md" textAlign={"center"}>
        Please reach out to our support team,{" "}
        <a href="mailto:support@northsky.social">support@northsky.social</a>.
      </Text>
    </>
  );
}
