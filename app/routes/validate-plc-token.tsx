import type { Route } from "./+types/home";
import { Heading, Highlight, Text, Input, Button } from "@chakra-ui/react";
import { Field } from "~/components/ui/field";
import { PasswordInput } from "~/components/ui/password-input";
import plc_screenshot from "../assets/plc_update.png";
import {
  redirect,
  useFetcher,
  type ClientActionFunctionArgs,
} from "react-router";

export function loader() {
  return { name: "northwoods.social" };
}

export async function clientAction({ request }: ClientActionFunctionArgs) {
  const data = await request.formData();
  const submitted = data.has("submit");

  if (submitted) {
    return redirect("/migrate");
  }
}

export default function ValidatePLCToken({ loaderData }: Route.ComponentProps) {
  const fetcher = useFetcher();
  return (
    <fetcher.Form>
      <Heading size="3xl" letterSpacing="tight">
        <Highlight query="to Bluesky">Check Your Email</Highlight>
      </Heading>
      <Text fontSize="md" textAlign={"center"}>
        Bluesky should have just sent you an e-mail to your inbox. Input that
        code below to continue migration.
      </Text>
      <img src={plc_screenshot} />
      <Field required label="PLC Token">
        <PasswordInput name="plc-token" />
      </Field>
      <Button name="submit" type="submit">
        Migrate!
      </Button>
    </fetcher.Form>
  );
}
