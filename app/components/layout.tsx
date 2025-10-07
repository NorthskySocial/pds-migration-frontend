import { Provider } from "@/components/ui/provider";
import { ColorModeProvider } from "@/components/ui/color-mode"
import { Container, Image, VStack,} from "@chakra-ui/react";
import logo from "../assets/Northsky-IconCentered-Color.png";
import nsBackground from "../assets/Northsky-Background.jpg";



export const Layout = ({ children }) => (
  <Provider>
    <ColorModeProvider forcedTheme="dark">
    <Container maxWidth={"4xl"} bgColor={"default"} >
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
    </ColorModeProvider>
  </Provider>
);
