import { Heading, Highlight, Text, Button } from "@chakra-ui/react";
import { redirect, useFetcher, type ActionFunctionArgs } from "react-router";
import { Checkbox } from "@/components/ui/checkbox";

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
    <fetcher.Form method="post">
      <Heading size="3xl" letterSpacing="tight">
        <Highlight query="your Data">Backup your data</Highlight>
      </Heading>
      <Text fontSize="md" textAlign={"center"}>
        We recommend you generate and download a backup of your data before you
        migrate from Bluesky's PDS to ours.
      </Text>
      <Text fontSize="md" textAlign={"center"}>
        We recommend using this simple web tool by Rose:
        <h3>
          <a href="">Bluesky Archival Tool</a>
        </h3>
      </Text>
      <Text fontSize="md" textAlign={"center"}>
        Once you have archived your data, press Continue to proceed with
        Migration
      </Text>
      <Checkbox name="confirm" required>
        I have backed up my data or do not wish to before migrating.
      </Checkbox>
      <Button type="submit" name="submit">
        Continue
      </Button>
    </fetcher.Form>
  );
}
