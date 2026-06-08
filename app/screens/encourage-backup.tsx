import {
  Heading,
  Highlight,
  Text,
  Button,
  List,
  Link,
  VStack,
  HStack,
} from "@chakra-ui/react";
import { Checkbox } from "@/components/ui/checkbox";
import { Box } from "@chakra-ui/react";
import type { ScreenProps } from "~/util/stages";
import { useFetcher } from "react-router";

export default function EncourageBackupScreen({ state }: ScreenProps) {
  const fetcher = useFetcher();
  return (
    <fetcher.Form method="post" style={{ width: "100%" }}>
      <VStack align={"center"} mb="5" width="100%">
        <Heading size="3xl" letterSpacing="tight" textAlign={"center"}>
          <Highlight query="your Data">Backup your data</Highlight>
        </Heading>
        <VStack align={"left"} mb="5">
          <Text fontSize="md" textAlign={"justify"} mb="4">
            The migration process is non-destructive, but if you would like to backup your account before migrating, we recommend using one of these tools:
          </Text>
          <List.Root ps="5">

            <List.Item>
              <Link
                color={"emphasized"}
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
                color={"emphasized"}
                variant="underline"
                target="_blank"
                href="https://github.com/NorthskySocial/pds-migration/"
              >
                Northsky Migration Tool
              </Link>
            </List.Item>

            <List.Root ps="5">
              <List.Item>Downloadable for Windows + Linux</List.Item>
              <List.Item>Free local backups to your computer</List.Item>
            </List.Root>


          </List.Root>
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
        </VStack>
        <Box mb="10" background={"muted"} color="fg" p="4" borderRadius={"2xl"}>
          <Checkbox name="confirm" required>
            I have backed up my data or do not wish to before migrating.
          </Checkbox>
        </Box>
        <HStack align={"left"} gap={"10"}>
          <Button name="cancel" type="submit" value={"cancel"} formNoValidate>
            Cancel
          </Button>
          <Button type="submit" name="submit">
            Continue
          </Button>

        </HStack>
      </VStack>
    </fetcher.Form>
  );
}
