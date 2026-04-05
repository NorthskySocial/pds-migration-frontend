import { Heading, Text, Button, VStack, Center } from "@chakra-ui/react";
import type { ScreenProps } from "~/util/stages";
import { useFetcher } from "react-router";

export default function MissingBlobsDoneScreen({ state }: ScreenProps) {
  const fetcher = useFetcher();
  return (
    <fetcher.Form method="post" style={{ width: "100%" }}>
      <VStack mb="5" width="100%">
        <Center>
          <Heading size="3xl" letterSpacing="tight" textAlign="center">
            Blobs Recovered!
          </Heading>
        </Center>
        <Text fontSize="md" textAlign="center" mt="4">
          Your missing blobs have been successfully recovered and imported to
          your Northsky account.
        </Text>
        <Text fontSize="md" textAlign="center" mt="2">
          You can now continue using Northsky as normal. All your images and
          media should be fully restored.
        </Text>
        <Button type="submit" name="done" mt="6">
          Done
        </Button>
      </VStack>
    </fetcher.Form>
  );
}
