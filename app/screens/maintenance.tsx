import { Heading, VStack, Text, Button } from "@chakra-ui/react";
import clock_art from "../assets/KTPClock.gif";
import { useEffect } from "react";
import type { ScreenProps } from "~/util/stages";

export default function MaintenanceScreen({ supportFormUrl, isUpstreamOutage }: ScreenProps) {
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
        <Heading size="3xl" letterSpacing="tight" textAlign={"center"}>
          The Migration Tool is temporarily unavailable
        </Heading>

        <img
          alt="A clock by artist Katie Tightpussy"
          src={clock_art}
          className="katie-clock"
          style={{ maxWidth: "50%" }}
        />

        {isUpstreamOutage ? (
          <>
            <Text fontSize="md" textAlign={"center"}>
              Bluesky is currently experiencing an API outage, which can degrade or prevent
              migrations from completing. We are pausing migrations via our migration tool
              until the outage is resolved. Please wait until the upstream service is restored
              and try again. This page will automatically refresh in 60 seconds.
            </Text>

            <Text fontSize="md" textAlign={"center"}>
              You can check Bluesky's status at{" "}
              <a href="https://status.bsky.app" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>
                status.bsky.app
              </a>
              {" "}for more information.
            </Text>
          </>
        ) : (
          <>
            <Text fontSize="md" textAlign={"center"}>
              The Northsky PDS is currently undergoing maintenance. Please wait a
              few minutes and try again. This page will automatically refresh in 60
              seconds.
            </Text>

            <Text fontSize="md" textAlign={"center"}>
              If it has been more than an hour and you're still seeing this message,
              please use the button below to contact support.
            </Text>
          </>
        )}

        <Button width="100%" onClick={handleRefresh}>
          Refresh
        </Button>
        {supportFormUrl && (
          <Button width="100%" onClick={handleSupportClick}>
            Contact Support
          </Button>
        )}
    </VStack>
  );
}
