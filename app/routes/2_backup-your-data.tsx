import { Heading, Highlight, Text, Button } from "@chakra-ui/react";
import { redirect, useFetcher, type ActionFunctionArgs } from "react-router";
import { Checkbox } from "@/components/ui/checkbox";
import { Box } from "@chakra-ui/react/box";
import { Layout } from "~/components/layout";

export function loader() {
  return { name: "northsky.social" };
}

export async function action({ request }: ActionFunctionArgs) {
  console.log("PAGE 2");
  const data = await request.formData();
  const submitted = data.has("submit");

  if (submitted) {
    return redirect("/connect-bluesky");
  }
}

export default function BackupNotice() {
  const fetcher = useFetcher();
  return (
    <Layout>
      <fetcher.Form
        method="post"
        style={{ display: "flex", flexDirection: "column" }}
      >
        <Heading size="3xl" letterSpacing="tight" textAlign={"center"}>
          <Highlight query="your Data">Backup your data</Highlight>
        </Heading>
        <Text fontSize="md" textAlign={"center"} mb="4">
          We recommend you generate and download a backup of your data before
          you migrate from Bluesky's PDS to ours.
        </Text>
        <Text fontSize="md" textAlign={"center"} mb="4">
          We recommend using this simple web tool by Rose:
          <Text fontSize="lg" fontWeight="bold">
            <a href="">Bluesky Archival Tool</a>
          </Text>
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
      </fetcher.Form>
    </Layout>
  );
}
