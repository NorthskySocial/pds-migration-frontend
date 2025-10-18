import { Provider } from "@/components/ui/provider";
import { DarkMode } from "@/components/ui/color-mode";
import { Container, Image, VStack } from "@chakra-ui/react";
import logo from "../assets/Northsky-IconCentered-Color.png";
import { useEffect, type ReactNode } from "react";
import type { STAGES } from "~/util/stages";

export const Layout = ({
  children,
  stage,
}: {
  children: ReactNode;
  stage: STAGES;
}) => {
  // Adds dataset property to documentElement
  useEffect(() => {
    document.documentElement.dataset.migratorStage = stage;
  }, [stage]);
  return (
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
        >
          <VStack padding="1em" width={"3xl"} alignItems={"center"}>
            <VStack mb="5">
              <Image height={"150px"} src={logo} alt="Northsky" />
            </VStack>

            {children}
          </VStack>
        </Container>
      </DarkMode>
    </Provider>
  );
};
