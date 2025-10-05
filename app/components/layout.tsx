import { Provider } from "@/components/ui/provider";
import { Container, Image, VStack } from "@chakra-ui/react";
import logo from "../assets/Northsky-IconCentered-Color.png";

export const Layout = ({ children }) => (
  <Provider>
    <Container maxWidth={"4xl"}>
      <VStack
        margin="0 auto"
        width={"3xl"}
        height={"100vh"}
        
        alignItems={"center"}
      >
        <VStack mb="5">
          <Image height={"150px"} src={logo} alt="Northsky" />
        </VStack>
        {children}
      </VStack>
    </Container>
  </Provider>
);
