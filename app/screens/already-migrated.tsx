import { Heading, Text, Button, VStack, Image, List, Link, Center, Grid, GridItem } from "@chakra-ui/react";
import nsChooseProvider from "../assets/nsChooseProvider.png";
import nsSignIn from "../assets/nsSignIn.png";
import nsSignIn2 from "../assets/nsSignIn2.png";
import nsNewAccount from "../assets/nsNewAccount.png";
import nsOtherAccount from "../assets/nsOtherAccount.png";
import type { ScreenProps } from "~/util/stages";

import { useFetcher } from "react-router";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function AlreadyMigratedScreen({ state }: ScreenProps) {
  const fetcher = useFetcher();
  return (
    <>
      <fetcher.Form method="post" style={{ width: "100%" }}>
        <Center>
          <Heading size="3xl" letterSpacing="tight" textAlign="center">
            Your Migration is Complete!
          </Heading>
        </Center>

        <br></br>
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap="6">
          <GridItem>
            <VStack mb="5" alignItems="flex-start">
              <Text fontSize="md" textAlign={"justify"}>
                Great news! Your account has already been migrated to Northsky
                and is active.
              </Text>
              <Text fontSize="md" textAlign={"justify"}>
                You can start using your Northsky account right away by
                following the steps below to log in via the Bluesky app.
              </Text>

              <Text fontSize="lg" fontWeight="bold" mt="4">
                How to access your Northsky account:
              </Text>

              <List.Root as="ol">
                <List.Item>
                  Go to{" "}
                  <Link
                    color={"emphasized"}
                    variant="underline"
                    target="_blank"
                    href="https://bsky.app/"
                  >
                    Bluesky
                  </Link>
                </List.Item>
                <List.Item>Under Settings, select "Switch Account"</List.Item>
                <List.Item>Select "Add Another Account"</List.Item>
                <List.Item>Select "Sign In"</List.Item>
                <List.Item>Select "Other Account"</List.Item>
                <List.Item>
                  On the Sign In dialog, select "Hosting Provider"
                </List.Item>
                <List.Item>
                  Select "Custom", and then fill in https://northsky.social as
                  your server address
                </List.Item>
                <List.Item>Select "Done"</List.Item>
                <List.Item>
                  Fill in your Northsky account handle and password
                </List.Item>
                <List.Item>Select "Next" to finish logging in</List.Item>
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
