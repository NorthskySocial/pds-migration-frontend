import { Provider } from "@/components/ui/provider";
import { Container, VStack } from "@chakra-ui/react";

export const Layout = ({ children }) => (
  <Provider>
    <Container>
      <VStack
        margin="0 auto"
        maxWidth={"350px"}
        height={"100vh"}
        justifyContent={"space-evenly"}
        alignItems={"center"}
      >
        {children}
      </VStack>
    </Container>
  </Provider>
);
