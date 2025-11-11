import { Heading, Text, Button, VStack, Image, List, Link, HStack, Center, Grid, GridItem } from "@chakra-ui/react";
import misleading_notice from "../assets/misleading.png";
import nsChooseProvider from "../assets/nsChooseProvider.png";
import nsSignIn from "../assets/nsSignIn.png";
import nsSignIn2 from "../assets/nsSignIn2.png";
import nsNewAccount from "../assets/nsNewAccount.png";
import nsOtherAccount from "../assets/nsOtherAccount.png";
import type { ReactElement } from "react";
import type { ScreenProps } from "~/util/stages";

import { useFetcher } from "react-router";

export default function EncourageBackupScreen({ state }: ScreenProps) {
  const fetcher = useFetcher();
  return (
    <>
      <fetcher.Form method="post">
        <Center>
          <Heading size="3xl" letterSpacing="tight">
            Welcome to Northsky!
          </Heading></Center>

        <br></br>
        <Grid templateColumns="repeat(2, 1fr)" gap="6">
          <GridItem>
            <VStack mb="5">
              {state.do_journey === "migrate" ? (
                <>
                  <Text fontSize="md" textAlign={"justify"}>
                    Your account has been migrated to Northsky successfully.
                  </Text>
                  <Text fontSize="md" textAlign={"justify"}>
                    When you next log in, Bluesky will prompt you to re-activate your
                    old account.
                  </Text>
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


                </>
              ) : (
                <>
                  <Text fontSize="md" textAlign={"justify"}>
                    Your new Northsky account is ready!
                  </Text>
                  <Text fontSize="md" textAlign={"justify"}>
                    You may now login via the Bluesky app using your new account's credentials.
                  </Text>
                </>
              )

              }
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


                </List.Item>
                <List.Item>
                  Select "Custom", and then fill in https://northsky.social as your server address


                </List.Item>
                <List.Item>
                  Select "Done"
                </List.Item>
                <List.Item>
                  Fill in your new Northsky account and password
                </List.Item>
                <List.Item>
                  Select "Next" to finish logging in
                </List.Item>
              </List.Root>

            </VStack>
          </GridItem>
          {/* <GridItem>
            <VStack>
              <Image src={nsNewAccount} alt="Adding a new account"></Image>
              <Image src={nsSignIn2} alt="Bluesky sign in dialog"></Image>
                                          <Image src={nsOtherAccount} alt="Choose other account"></Image>

              <Image src={nsSignIn} alt="Bluesky sign in dialog"></Image>
              <Image src={nsChooseProvider} alt="Choose your Provder"></Image>
            </VStack>
          </GridItem> */}
        </Grid>
        <Center>
          <Button name="cancel" type="submit" value={"cancel"} formNoValidate>
            Start Over
          </Button>
        </Center>
      </fetcher.Form>

    </>

  );
}
