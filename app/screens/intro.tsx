import {
  Heading,
  Highlight,
  VStack,
  Text,
  Input,
  HStack,
  Button,
  Box,
  Image,
  Link,
} from "@chakra-ui/react";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import type { ScreenProps } from "~/util/stages";
import { useFetcher } from "react-router";


export default function IntroScreen({ state }: ScreenProps) {
  const fetcher = useFetcher();
  return (
    <fetcher.Form method="post">
      <VStack mb="5">
        <Heading size="3xl" letterSpacing="tight" textAlign={"center"}>
          <Highlight query="to Northsky">Sign Up to Northsky</Highlight>
        </Heading>
        <br></br>

        <Heading size="xl" textAlign={"center"}>
          The Northsky Social team welcomes you to join us in safer skies.
        </Heading>
        <br></br>

        <Text fontSize="md" textAlign={"justify"}>
          Your data will be hosted securely on our servers and your experience
          will be improved by our moderation team and new safety features we
          develop.
        </Text>
        <Text fontSize="md" textAlign={"justify"}>
          If things don't work out, we'll happily migrate your data to another
          PDS server. Even if you get banned, we won't hold your data hostage.
        </Text>
        <Text fontSize="md" textAlign={"justify"}>
          By entering your invite code, you accept these terms, and consent to
          migrating your data to Northsky's servers.
        </Text>
      </VStack>
      <VStack>
        <Heading size="xl">Enter your invite code to get started</Heading>
        <Field
          invalid={fetcher?.data?.error}
          errorText={fetcher?.data?.error}
          mb="4"
        >
          <Input
            required
            name="invite-code"
            placeholder="Enter your invite code"
          />
        </Field>

        <Box maxW={"md"} mb="4">
          <VStack alignItems={"left"}>
            <Checkbox required name="agree-to-tos">
              I agree to the{" "}
              <Link
                color={"emphasized"}
                variant="underline"
                target="_blank"
                href="https://northskysocial.com/posts/terms-of-service"
              >
                Northsky Terms of Service
              </Link>
            </Checkbox>

            <Checkbox required name="agree-to-privacy">
              I agree to the{" "}
              <Link
                color={"emphasized"}
                variant="underline"
                target="_blank"
                href="https://northskysocial.com/posts/privacy-policy"
              >
                Northsky Privacy Policy
              </Link>
            </Checkbox>
          </VStack>
        </Box>
        <HStack>
          <Button type="submit" name="create" value="create">
            Create new account
          </Button>
          <Button type="submit" name="migrate" value="migrate">
            Migrate existing account
          </Button>
        </HStack>
      </VStack>
    </fetcher.Form>
  );
}
