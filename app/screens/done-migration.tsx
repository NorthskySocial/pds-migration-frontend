import { Heading, Text, Button, VStack, Image } from "@chakra-ui/react";
import misleading_notice from "../assets/misleading.png";
import type { ReactElement } from "react";
import type { ScreenProps } from "~/util/stages";

export default function DoneMigrationScreen({
  state,
}: ScreenProps): ReactElement {
  return (
    <>
      <VStack mb="5">
        {state.get("do_journey") === "migrate" ? (
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
          </>
        ) : (
          <>
            <Heading size="3xl" letterSpacing="tight">
              New account creatd!
            </Heading>
            <Text fontSize="md" textAlign={"center"}>
              You may now login via the Bluesky app using the provided
              credentials. Make sure to set "Hosting Provider" to "Custom" and
              enter: <br />
              <strong>https://northsky.social</strong>
            </Text>
          </>
        )}
      </VStack>
    </>
  );
}
