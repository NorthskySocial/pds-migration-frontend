import { Heading, Text, Button, VStack, Image, List, Link, } from "@chakra-ui/react";
import misleading_notice from "../assets/misleading.png";
import nsChooseProvider from "../assets/nsChooseProvider.png";
import nsSignIn from "../assets/nsSignIn.png";
import type { ReactElement } from "react";
import type { ScreenProps } from "~/util/stages";

import { useFetcher } from "react-router";

export default function EncourageBackupScreen({ state }: ScreenProps) {
  const fetcher = useFetcher();
  return (
    <>
      <fetcher.Form method="post">
        <VStack mb="5">
          {state.do_journey === "migrate" ? (
            <>
              <Heading size="3xl" letterSpacing="tight">
                Migration completed
              </Heading>
              <Text fontSize="md" textAlign={"justify"}>
                Your data has been migrated successfully.
              </Text>
              <Text fontSize="md" textAlign={"justify"}>
                When you next log in, Bluesky will prompt you to re-activate your
                old account.
              </Text>
              <img
                alt="Screenshot of a misleading Bluesky dialog. It says 'Welcome back! You previously deactivated [your handle]. You can reactivate your account to continue logging in. Your profile and posts will be visible to other users.' "
                src={misleading_notice}
              />
              <Text fontSize="md" textAlign={"justify"}>
                If you try Yes,{" "}
                <strong style={{ textDecoration: "underline" }}>
                  it will not work.
                </strong>
              </Text>
              <Text fontSize="md" textAlign={"justify"}>
                Instead, hit <strong>Cancel</strong> and log in with your new
                username and password.
              </Text>

                            <List.Root as="ol">
                <List.Item>Go to {" "}
                  <Link
                    color={"emphasized"}
                    variant="underline"
                    target="_blank"
                    href="https://bsky.app/"
                  >
                    Bluesky</Link>
                </List.Item>
                <List.Item>
                  Under Settings, select "Switch Account"
                </List.Item>
                <List.Item>
                  Select "Add Another Account"
                </List.Item>
                <List.Item>
                  Select "Sign In"
                </List.Item>
                <List.Item>
                  Select "Other Account"
                </List.Item>
                <List.Item>
                  On the Sign In dialog, select "Hosting Provider"
                  <Image src={nsSignIn} alt="Bluesky sign in dialog"></Image>

                </List.Item>
                <List.Item>
                 Select "Custom", and then fill in https://northsky.social as your server address
                  <Image src={nsChooseProvider} alt="Choose your Provder"></Image>

                </List.Item>
                                <List.Item>
                  Select "Done"
                </List.Item>
                                <List.Item>
                  Fill in your new Northsky account and password
                </List.Item>
                                <List.Item>
                  Select "Other Account"
                </List.Item>
              </List.Root>

              <Button name="cancel" type="submit" value={"cancel"} formNoValidate>
               Start Over
              </Button>
            </>
          ) : (
            <>
              <Heading size="3xl" letterSpacing="tight">
                New account created!
              </Heading>
              <Text fontSize="md" textAlign={"justify"}>
                You may now login via the Bluesky app using your new account's credentials.
              </Text>
              <List.Root as="ol">
                <List.Item>Go to {" "}
                  <Link
                    color={"emphasized"}
                    variant="underline"
                    target="_blank"
                    href="https://bsky.app/"
                  >
                    Bluesky</Link>
                </List.Item>
                <List.Item>
                  Under Settings, select "Switch Account"
                </List.Item>
                <List.Item>
                  Select "Add Another Account"
                </List.Item>
                <List.Item>
                  Select "Sign In"
                </List.Item>
                <List.Item>
                  Select "Other Account"
                </List.Item>
                <List.Item>
                  On the Sign In dialog, select "Hosting Provider"
                  <Image src={nsSignIn} alt="Bluesky sign in dialog"></Image>

                </List.Item>
                <List.Item>
                 Select "Custom", and then fill in https://northsky.social as your server address
                  <Image src={nsChooseProvider} alt="Choose your Provder"></Image>

                </List.Item>
                                <List.Item>
                  Select "Done"
                </List.Item>
                                <List.Item>
                  Fill in your new Northsky account and password
                </List.Item>
                                <List.Item>
                  Select "Other Account"
                </List.Item>
              </List.Root>

              <Button name="cancel" type="submit" value={"cancel"} formNoValidate>
                Start Over
              </Button>
            </>


          )

          }

        </VStack>
      </fetcher.Form>

    </>

  );
}
