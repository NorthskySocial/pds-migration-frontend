import { Heading, Text, Progress, VStack } from "@chakra-ui/react";
import clock_art from "../assets/clock.jpg";
import { InfoTip } from "@/components/ui/toggle-tip";
import type { ScreenProps } from "~/util/types";

export default function MigrationProgressScreen({
  state,
  fetcher,
}: ScreenProps) {
  return (
    <>
      <VStack
        margin="0 auto"
        maxWidth={"350px"}
        height={"70vh"}
        justifyContent={"space-evenly"}
        alignItems={"center"}
      >
        <Heading size="3xl" letterSpacing="tight" textAlign={"center"}>
          Migrating....
        </Heading>
        <Text fontSize="md" textAlign={"center"}>
          Your data is being moved to our servers
        </Text>
        <img
          alt="A clock by artist Katie Tightpussy"
          src={clock_art}
          className="katie-clock"
        />
        {error ? (
          <h1>{error}</h1>
        ) : (
          <Progress.Root
            width="100%"
            max={8}
            min={0}
            value={stageIdx}
            striped
            animated
          >
            <Progress.Label mb="2">
              {stageTitle}
              <InfoTip>{stageDescription}</InfoTip>
            </Progress.Label>
            <Progress.Track>
              <Progress.Range />
            </Progress.Track>
          </Progress.Root>
        )}
      </VStack>
    </>
  );
}
