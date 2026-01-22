import { Provider } from "@/components/ui/provider";
import { DarkMode } from "@/components/ui/color-mode";
import { Container, Image, VStack } from "@chakra-ui/react";
import logo from "../assets/Northsky-IconCentered-Color.png";

export const Layout = ({ children }) => (
  <Provider>
    <DarkMode>
      {/* <ColorModeProvider forcedTheme="dark" /> */}
      <Container
        maxWidth={"4xl"}
        bgColor={"{colors.brand.bg}"}
        minHeight={"100vh"}
        display={"flex"}
        flexDirection={"column"}
        justifyContent={"center"}
        alignItems={"center"}
        px={{ base: 4, md: 6 }}
        overflowX={"hidden"}
      >
        <VStack padding="1em" width="100%" maxWidth={"3xl"} alignItems={"center"}>
          <VStack mb="5">
            <Image height={"150px"} src={logo} alt="Northsky" />
          </VStack>

          {children}
        </VStack>
      </Container>
    </DarkMode>
  </Provider>
);
