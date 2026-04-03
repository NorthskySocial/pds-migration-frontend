import { Heading, VStack, Text, Button } from "@chakra-ui/react";
import clock_art from "../assets/KTPClock.gif";
import { useEffect } from "react";
import type { ScreenProps } from "~/util/stages";

export default function MaintenanceScreen({ supportFormUrl }: ScreenProps) {
  const handleRefresh = () => {
    window.location.reload();
  };

  const handleSupportClick = () => {
    if (supportFormUrl) {
      window.open(supportFormUrl, "_blank", "noopener,noreferrer");
    }
  };

  // auto-refresh every minute
  useEffect(() => {
    const timer = setTimeout(() => {
      handleRefresh();
    }, 60000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <VStack mb="5" width="100%">
      <VStack
        margin="0 auto"
        maxWidth={"350px"}
        height={"70vh"}
        justifyContent={"space-evenly"}
        alignItems={"center"}
      >
        <Heading size="3xl" letterSpacing="tight" textAlign={"center"}>
          The Migration Tool is temporarily unavailable
        </Heading>

        <img
          alt="A clock by artist Katie Tightpussy"
          src={clock_art}
          className="katie-clock"
        />

        <Text fontSize="md" textAlign={"center"}>
          The Northsky PDS is currently undergoing maintenance. Please wait a
          few minutes and try again. This page will automatically refresh in 60
          seconds.
        </Text>

        <Text fontSize="md" textAlign={"center"}>
          If it has been more than an hour and you're still seeing this message,
          please use the button below to contact support.
        </Text>

        <Button width="100%" onClick={handleRefresh}>
          Refresh
        </Button>
        {supportFormUrl && (
          <Button width="100%" onClick={handleSupportClick}>
            Contact Support
          </Button>
        )}
      </VStack>
    </VStack>
  );
}
