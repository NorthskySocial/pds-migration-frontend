import { Heading, Text, Progress, VStack, Image, } from "@chakra-ui/react";
import clock_art from "../assets/clock.jpg";
import { InfoTip } from "@/components/ui/toggle-tip";
import type { ScreenProps } from "~/util/stages";
import { useFetcher } from "react-router";
import { stageInfo, STAGES } from "~/util/stages";
import { useEffect } from "react";

export default function MigrationProgressScreen({ stage, error }: ScreenProps) {
  const fetcher = useFetcher();
  if (!stage) throw new Error("Invalid stage received");

  const { stageIdx, stageTitle, stageDescription } = stageInfo[stage];

  // Immediately submit to go to next step
  useEffect(() => {
    (async () => {
      if (
        fetcher.state === "idle" &&
        !error &&
        [
          STAGES.EXPORT_REPO_ORIGIN,
          STAGES.IMPORT_REPO_DEST,
          STAGES.EXPORT_BLOBS_ORIGIN,
          STAGES.IMPORT_BLOBS_DEST,
          STAGES.MIGRATE_PREFERENCES,
          STAGES.REQUEST_PLC,
        ].includes(stage)
      ) {
        setTimeout(
          async () => {
            await fetcher.submit({}, { method: "post" });
          },
          import.meta.env.DEV ? 500 : 0
        );
      }
    })();
  }, [fetcher, stage, error]);

  return (
    <fetcher.Form method="post">      <VStack mb="5">

      <Image height={"150px"} src="../../app/assets/Northsky-IconCentered-Color.png" alt="Northsky" />

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
        <Text fontSize="md" textAlign={"justify"}>
          Your data is being moved to our servers
        </Text>
        <img
          alt="A clock by artist Katie Tightpussy"
          src={clock_art}
          className="katie-clock"
        />

        <Progress.Root
          width="100%"
          max={6}
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
      </VStack>
    </VStack>
    </fetcher.Form>
  );
}
