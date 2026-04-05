import {
  Heading,
  Highlight,
  VStack,
  Text,
  Input,
  Button,
  Box,
  Link,
} from "@chakra-ui/react";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import type { ScreenProps } from "~/util/stages";
import { useFetcher } from "react-router";

export default function IntroScreen({ state }: ScreenProps) {
  const fetcher = useFetcher();
  return (
    <fetcher.Form method="post" style={{ width: "100%" }}>
      <VStack mb="5" width="100%">
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
        <Box width="100%" maxWidth="560px" aspectRatio="16/9">
          <iframe
            width="100%"
            height="100%"
            src="https://www.youtube.com/embed/wKPBH8j5HDM?si=uf4ioqAn80p2L3UY"
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </Box>
      </VStack>
      <VStack width="100%">
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
        <VStack width="100%" gap={4}>
          <VStack width="100%" gap={2}>
            <Text fontSize="sm" color="fg.muted">If it's your first time here:</Text>
            <Button width="100%" type="submit" name="migrate" value="migrate">
              Migrate existing account
            </Button>
            <Button width="100%" type="submit" name="create" value="create">
              Create new account
            </Button>
          </VStack>

          <VStack width="100%" gap={2}>
            <Text fontSize="sm" color="fg.muted">If you started a migration and it failed:</Text>
            <Button formNoValidate width="100%" type="submit" name="resume" value="resume">
              Resume failed migration
            </Button>
          </VStack>

          <VStack width="100%" gap={2}>
            <Text fontSize="sm" color="fg.muted">If you migrated successfully but are missing blobs:</Text>
            <Button formNoValidate width="100%" type="submit" name="missing-blobs" value="missing-blobs">
              Import missing blobs
            </Button>
          </VStack>
        </VStack>
      </VStack>
    </fetcher.Form>
  );
}
