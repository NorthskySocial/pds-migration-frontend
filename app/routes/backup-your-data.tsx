import type { Route } from "./+types/home";
import {
  Heading,
  Highlight,
  VStack,
  Text,
  Input,
  HStack,
  Button,
  Box,
  Container,
} from "@chakra-ui/react";
import {
  redirect,
  useFetcher,
  type ClientActionFunctionArgs,
} from "react-router";
import { Checkbox } from "~/components/ui/checkbox";

export function loader() {
  return { name: "northsky.social" };
}

export async function clientAction({ request }: ClientActionFunctionArgs) {
  const data = await request.formData();
  const submitted = data.has("submit");
  console.log(submitted);
  if (submitted) {
    return redirect("/new-account");
  }
}

export default function BackupNotice({ loaderData }: Route.ComponentProps) {
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
      <Checkbox required>
        I have backed up my data or do not wish to before migrating.
      </Checkbox>
      <Button type="submit" name="submit">
        Continue
      </Button>
    </fetcher.Form>
  );
}
