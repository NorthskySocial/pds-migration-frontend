import { Heading, Highlight, Text, Button } from "@chakra-ui/react";
import { Checkbox } from "@/components/ui/checkbox";
import { Box, Span } from "@chakra-ui/react/box";
import type { ScreenProps } from "~/util/types";

export default function EncourageBackupScreen({ state, fetcher }: ScreenProps) {
  return (
    <>
      <Heading size="3xl" letterSpacing="tight" textAlign={"center"}>
        <Highlight query="your Data">Backup your data</Highlight>
      </Heading>
      <Text fontSize="md" textAlign={"center"} mb="4">
        We recommend you generate and download a backup of your data before you
        migrate from Bluesky's PDS to ours.
      </Text>
      <Text fontSize="md" textAlign={"center"} mb="4">
        We recommend using this simple web tool by Rose:
        <Span fontSize="lg" fontWeight="bold">
          <a href="">Bluesky Archival Tool</a>
        </Span>
      </Text>
      <Text fontSize="md" textAlign={"center"} mb="4">
        Once you have archived your data, press Continue to proceed with
        Migration
      </Text>
      <Box
        mb="10"
        background={"muted/30"}
        color="secondary"
        p="4"
        borderRadius={"2xl"}
      >
        <Checkbox name="confirm" required>
          I have backed up my data or do not wish to before migrating.
        </Checkbox>
      </Box>
      <Button type="submit" name="submit" margin={"0 auto"}>
        Continue
      </Button>
    </>
  );
}
