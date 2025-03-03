import type { Route } from "./+types/done";
import { Heading, Text, Button } from "@chakra-ui/react";
import misleading_notice from "../assets/misleading.png";
import melted_clock from "../assets/melted.jpg";
import { data, redirect, useFetcher } from "react-router";
import { getSession, commitSession } from "../sessions.server";

const { MIGRATOR_BACKEND, PDS_HOSTNAME } = import.meta.env;

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  return data(
    { error: session.get("error") },
    {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    }
  );
}

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  return {
    ok: true,
  };
}

export default function Migrate({ loaderData }: Route.ComponentProps) {
  const fetcher = useFetcher();
  switch (fetcher.data?.status) {
    case "complete":
      return (
        <>
          <Heading size="3xl" letterSpacing="tight">
            Migration completed
          </Heading>
          <Text fontSize="md" textAlign={"center"}>
            Your data has been migrated successfully.
          </Text>
          <Text fontSize="md" textAlign={"center"}>
            When you next log in, Bluesky will prompt you to re-activate your
            old account.
          </Text>
          <img
            alt="Screenshot of a misleading Bluesky dialog. It says 'Welcome back! You previously deactivated [your handle]. You can reactivate your account to continue logging in. Your profile and posts will be visible to other users.' "
            src={misleading_notice}
          />
          <Text fontSize="md" textAlign={"center"}>
            If you try Yes,{" "}
            <strong style={{ textDecoration: "underline" }}>
              it will not work.
            </strong>
          </Text>
          <Text fontSize="md" textAlign={"center"}>
            Instead, hit <strong>Cancel</strong> and log in with your new
            username and password.
          </Text>
          <Button name="login-to-northsky" type="submit">
            Login to Northsky
          </Button>
        </>
      );
    case "failed":
      return (
        <>
          <Heading size="3xl" letterSpacing="tight">
            Migration failed
          </Heading>
          <Text fontSize="md" textAlign={"center"}>
            An unexpected error has occurred while migrating your data.
          </Text>
          <img
            alt="Image of melting clocks by artist Katie Tightpussy"
            src={melted_clock}
          />
          <Text fontSize="md" textAlign={"center"}>
            Please reach out to our support team,{" "}
            <a href="mailto:support@northsky.social">support@northsky.social</a>
            .
          </Text>
        </>
      );
  }
}
