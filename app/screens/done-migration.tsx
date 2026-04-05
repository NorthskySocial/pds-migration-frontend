import { Heading, Text, Button, VStack, Image, List, Link, Center, Grid, GridItem, Alert } from "@chakra-ui/react";
import nsChooseProvider from "../assets/nsChooseProvider.png";
import nsSignIn from "../assets/nsSignIn.png";
import nsSignIn2 from "../assets/nsSignIn2.png";
import nsNewAccount from "../assets/nsNewAccount.png";
import nsOtherAccount from "../assets/nsOtherAccount.png";
import type { ScreenProps } from "~/util/stages";

import { useFetcher } from "react-router";

export default function EncourageBackupScreen({ state }: ScreenProps) {
  const fetcher = useFetcher();
  return (
    <>
      <fetcher.Form method="post" style={{ width: "100%" }}>
        <Center>
          <Heading size="3xl" letterSpacing="tight" textAlign="center">
            Welcome to Northsky!
          </Heading></Center>

        <br></br>
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap="6">
          <GridItem>
            <VStack mb="5">
              {state.do_journey === "migrate" ? (
                <>
                  <Text fontSize="md" textAlign={"justify"}>
                    Your account has been migrated to Northsky successfully.
                  </Text>
                  {state.had_invalid_blobs && (
                    <Alert.Root status="info" mt="3" mb="3">
                      <Alert.Indicator />
                      <Alert.Content>
                        <Alert.Title>Some media blobs could not be transferred</Alert.Title>
                        <Alert.Description>
                          Your migration still completed successfully and you can follow the steps below to access your account.
                          You can also go back to the home screen to recover missing media by selecting "Import missing blobs",
                          and we will attempt to import the missing blobs again.
                        </Alert.Description>
                      </Alert.Content>
                    </Alert.Root>
                  )}
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
          <GridItem>
            <VStack>
              <Image src={nsNewAccount} alt="Adding a new account" maxWidth="100%" height="auto" />
              <Image src={nsSignIn2} alt="Bluesky sign in dialog" maxWidth="100%" height="auto" />
                                          <Image src={nsOtherAccount} alt="Choose other account" maxWidth="100%" height="auto" />

              <Image src={nsSignIn} alt="Bluesky sign in dialog" maxWidth="100%" height="auto" />
              <Image src={nsChooseProvider} alt="Choose your Provder" maxWidth="100%" height="auto" />
            </VStack>
          </GridItem>
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
