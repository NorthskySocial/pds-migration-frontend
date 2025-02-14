import {
  Heading,
  Highlight,
  VStack,
  Text,
  Input,
  HStack,
  Button,
  Box,
  Container,
} from "@chakra-ui/react";
import { Checkbox } from "@/components/ui/checkbox";

function App() {
  return (
    <Container>
      <VStack height={"100vh"} justifyContent={"space-evenly"}>
        <VStack>
          <Heading size="3xl" letterSpacing="tight">
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
          <Input placeholder="Enter your invite code" />
          <Box maxW={"md"}>
            <Checkbox>I agree to the Northsky Terms of Service</Checkbox>
          </Box>
          <HStack>
            <Button>Create new account</Button>
            <Button>Migrate existing account</Button>
          </HStack>
        </VStack>
      </VStack>
    </Container>
  );
}

export default App;
