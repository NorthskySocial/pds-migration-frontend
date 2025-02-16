import type { Route } from "./+types/home";
import { Heading, Text, Progress, VStack, Button } from "@chakra-ui/react";
import clock_art from "../assets/clock.jpg";
import misleading_notice from "../assets/misleading.png";
import melted_clock from "../assets/melted.jpg";
import {
  redirect,
  useFetcher,
  type ClientActionFunctionArgs,
} from "react-router";

export function loader() {
  return { name: "northwoods.social" };
}

export async function clientAction({ request }: ClientActionFunctionArgs) {
  await new Promise((r) => setTimeout(r, 20000)); //
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
          <Button name="submit" type="submit">
            Login to Northwoods
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
            <a href="mailto:support@northwoods.social">
              support@northwoods.social
            </a>
            .
          </Text>
        </>
      );
    case "in-progress":
    default:
      return (
        <fetcher.Form>
          <VStack
            margin="0 auto"
            maxWidth={"350px"}
            height={"70vh"}
            justifyContent={"space-evenly"}
            alignItems={"center"}
          >
            <Heading size="3xl" letterSpacing="tight">
              Migrating....
            </Heading>
            <Text fontSize="md" textAlign={"center"}>
              Your data is being moved from Bluesky to our servers
            </Text>
            <img alt="A clock by artist Katie Tightpussy" src={clock_art} />
            <Progress.Root width="100%" striped value={null}>
              <Progress.Track>
                <Progress.Range />
              </Progress.Track>
            </Progress.Root>
          </VStack>
        </fetcher.Form>
      );
  }
}
