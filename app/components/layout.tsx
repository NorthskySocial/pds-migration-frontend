import { Provider } from "@/components/ui/provider";
import { Container, Image, VStack } from "@chakra-ui/react";
import logo from "../assets/Northsky-IconCentered-Color.png";

export const Layout = ({ children }) => (
  <Provider>
    <Container width={"350px"}>
      <VStack
        margin="0 auto"
        width={"350px"}
        height={"100vh"}
        justifyContent={"space-evenly"}
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
