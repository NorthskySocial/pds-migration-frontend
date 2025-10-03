import {
  Heading,
  Highlight,
  Text,
  Button,
  Image,
  List,
  Link,
  VStack,
} from "@chakra-ui/react";
import { Checkbox } from "@/components/ui/checkbox";
import { Box, Span } from "@chakra-ui/react";
import type { ScreenProps } from "~/util/stages";
import { useFetcher } from "react-router";

export default function EncourageBackupScreen({ state }: ScreenProps) {
  const fetcher = useFetcher();
  return (
    <fetcher.Form method="post">
      <VStack mb="5">
        <Heading size="3xl" letterSpacing="tight" textAlign={"center"}>
          <Highlight query="your Data">Backup your data</Highlight>
        </Heading>
        <Text fontSize="md" textAlign={"justify"} mb="4">
          We recommend you generate and download a backup of your data before
          you migrate from Bluesky's PDS to ours. We recommend using one of
          these tools:
        </Text>
        <br />
        <List.Root ps="5">
          <List.Item>
            <Link
              variant="underline"
              target="_blank"
              href="https://github.com/NorthskySocial/pds-migration/releases"
            >
              Northsky Migration Tool
            </Link>
          </List.Item>

          <List.Root ps="5">
            <List.Item>Downloadable for Windows + Linux</List.Item>
            <List.Item>Free local backups to your computer</List.Item>
          </List.Root>

          <List.Item>
            <Link
              variant="underline"
              target="_blank"
              href="https://atbackup.pages.dev/"
            >
              ATBackup
            </Link>
          </List.Item>

          <List.Root ps="5">
            <List.Item>Downloadable or Mac + Windows</List.Item>
            <List.Item>Free local backups to your computer</List.Item>
          </List.Root>
          <List.Item>
            <Link
              variant="underline"
              target="_blank"
              href="https://bsky.storage/"
            >
              Storacha
            </Link>
          </List.Item>
          <List.Root ps="5">
            <List.Item>Web-based, cloud backup</List.Item>
            <List.Item>
              Free up to 5gb, but requires Credit Card to sign up.
            </List.Item>
            <List.Item>
              Not affiliated with Northsky (Use at your own risk!)
            </List.Item>
          </List.Root>
        </List.Root>
        <br />
        <Text fontSize="md" textAlign={"justify"} mb="4">
          Once it has completed, your backup should contain:
          <List.Root ps="5">
            <List.Item>A *.car file of your account and text posts</List.Item>
            <List.Item>A folder with your media blobs inside it</List.Item>
          </List.Root>
          <br />
          Once you have archived your data, press Continue to proceed with
          Migration
        </Text>
        <Box mb="10" background={"muted"} color="fg" p="4" borderRadius={"2xl"}>
          <Checkbox name="confirm" required>
            I have backed up my data or do not wish to before migrating.
          </Checkbox>
        </Box>
        <Button type="submit" name="submit" margin={"0 auto"}>
          Continue
        </Button>
      </VStack>
    </fetcher.Form>
  );
}
