import {
  Heading,
  Highlight,
  VStack,
  Text,
  Input,
  HStack,
  Button,
  Box,
} from "@chakra-ui/react";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";

export default function IntroScreen() {
  return (
    <>
      <VStack mb="5">
        <Heading size="3xl" letterSpacing="tight" textAlign={"center"}>
          <Highlight query="to Northsky">Migrate to Northsky</Highlight>
        </Heading>
        <Text fontSize="md" textAlign={"center"}>
          The Northsky Social team welcomes you to join us in safer skies.
        </Text>
        <Text fontSize="md" textAlign={"center"}>
          Your data will be hosted securely on our servers and your experience
          will be improved by our moderation team and new safety features we
          develop.
        </Text>
        <Text fontSize="md" textAlign={"center"}>
          If things don't work out, we'll happily migrate your data to another
          PDS server. Even if you get banned, we won't hold your data hostage.
        </Text>
        <Text fontSize="md" textAlign={"center"}>
          By entering your invite code, you accept these terms, and consent to
          migrating your data to Northsky's servers.
        </Text>
      </VStack>
      <VStack>
        <Field
          invalid={fetcher.data?.error}
          errorText={fetcher.data?.error}
          mb="4"
        >
          <Input name="invite-code" placeholder="Enter your invite code" />
        </Field>

        <Box maxW={"md"} mb="4">
          <Checkbox name="agree-to-tos">
            I agree to the Northsky Terms of Service
          </Checkbox>
        </Box>
        <HStack>
          <Button type="submit" name="create">
            Create new account
          </Button>
          <Button type="submit" name="migrate">
            Migrate existing account
          </Button>
        </HStack>
      </VStack>
    </>
  );
}
