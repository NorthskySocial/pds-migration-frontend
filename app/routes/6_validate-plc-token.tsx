import type { Route } from "./+types/validate-plc-token";
import { Heading, Highlight, Text, Button } from "@chakra-ui/react";
import { Field } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import plc_screenshot from "../assets/plc_update.png";
import { redirect, useFetcher } from "react-router";

export function loader() {
  return { name: "northsky.social" };
}
const { MIGRATOR_BACKEND, PDS_HOSTNAME } = import.meta.env;

export async function action({ request }: Route.ActionArgs) {
  console.log("PAGE 5");
  const data = await request.formData();
  const submitted = data.has("submit");
  const plcToken = data.get("plc-token") as string;

  if (submitted) {
    // activate new account
    fetch(`${MIGRATOR_BACKEND}/activate-account`, {
      method: "post",
      body: JSON.stringify({
        pds_host: PDS_HOSTNAME,
        handle: "<<new_handle>>",
        password: "<<new_password>>",
      }),
    });

    // deactivate old account
    fetch(`${MIGRATOR_BACKEND}/deactivate-account`, {
      method: "post",
      body: JSON.stringify({
        pds_host: "<<old_host>>",
        handle: "<<old_handle>>",
        password: "<<old_password>>",
      }),
    });

    // deactivate old account
    fetch(`${MIGRATOR_BACKEND}/migrate-plc`, {
      method: "post",
      body: JSON.stringify({
        new_pds_host: PDS_HOSTNAME,
        new_handle: "<<new_handle>>",
        new_password: "<<new_password>>",
        old_pds_host: "<<old_host>>",
        old_handle: "<<old_handle>>",
        old_password: "<<old_password>>",
        plc_signing_token: plcToken,
      }),
    });
    return redirect("/done");
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
