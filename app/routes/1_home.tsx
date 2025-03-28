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
} from "@chakra-ui/react";
import { redirect, useFetcher } from "react-router";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { getSession, commitSession } from "../sessions.server";

const hostname = import.meta.env.PDS_HOSTNAME ?? "localhost";
const inviteRegex = new RegExp(
  `^${hostname.replace(/\./g, "-")}-[a-z0-9]{5}-[a-z0-9]{5}$`
);

export async function action({ request }: Route.ActionArgs) {
  console.log("PAGE 1");
  const session = await getSession(request.headers.get("Cookie"));
  const data = await request.formData();
  const isNewAccount = data.has("create");
  const inviteCode = data.get("invite-code") as string;
  console.log(data.get("agree-to-tos"));
  const confirmedTOS = data.get("agree-to-tos") === "on";

  const inviteCodeValid = inviteRegex.test(inviteCode as string);

  if (!confirmedTOS)
    return { ok: false, error: "Please agree to the Terms Of Service" };

  if (!inviteCode || !inviteCodeValid)
    return { ok: false, error: "Please enter a valid invite code" };

  session.set("inviteCode", inviteCode);

  return redirect(isNewAccount ? `/new-account` : `/backup-your-data`, {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

export default function Home() {
  const fetcher = useFetcher();
  return (
    <fetcher.Form method="post">
      <VStack>
        <Heading size="3xl" letterSpacing="tight">
          <Highlight query="to Northsky">Migrate to Northsky</Highlight>
        </Heading>
        <Text fontSize="md" textAlign={"center"}>
          The Northsky Social team welcomes you to join us in safer skies.
        </Text>
        <Text fontSize="md" textAlign={"center"}>
          Your data will be hosted securely on our servers and your experience
          will be improved by our moderation team and new safety features we
          develop.
        </Text>
        <Text fontSize="md" textAlign={"center"}>
          If things don't work out, we'll happily migrate your data to another
          PDS server. Even if you get banned, we won't hold your data hostage.
        </Text>
        <Text fontSize="md" textAlign={"center"}>
          By entering your invite code, you accept these terms, and consent to
          migrating your data to Northsky's servers.
        </Text>
      </VStack>
      <VStack>
        <Field invalid={fetcher.data?.error} errorText={fetcher.data?.error}>
          <Input name="invite-code" placeholder="Enter your invite code" />
        </Field>

        <Box maxW={"md"}>
          <Checkbox name="agree-to-tos">
            I agree to the Northsky Terms of Service
          </Checkbox>
        </Box>
        <HStack>
          <Button type="submit" name="create">
            Create new account
          </Button>
          <Button type="submit" name="migrate">
            Migrate existing account
          </Button>
        </HStack>
      </VStack>
    </fetcher.Form>
  );
}
