import { Heading, Text, Progress, VStack, Button } from "@chakra-ui/react";
import clock_art from "../assets/KTPClock.gif";
import { InfoTip } from "@/components/ui/toggle-tip";
import type { ScreenProps } from "~/util/stages";
import { useFetcher } from "react-router";
import { stageInfo, STAGES } from "~/util/stages";
import { useEffect } from "react";

export default function MissingBlobsProgressScreen({
  stage,
  state: { export_progress, upload_progress },
  error,
}: ScreenProps) {
  const fetcher = useFetcher();
  if (!stage) throw new Error("Invalid stage received");

  const { stageIdx, stageTitle, stageDescription } = stageInfo[stage];

  const getSecondaryProgressBar = () => {
    switch (stage) {
      case STAGES.MISSING_BLOBS_EXPORT:
        if (!export_progress) return null;

        return (
          <Progress.Root
            width="100%"
            max={export_progress?.total}
            min={0}
            value={
              export_progress.invalid_blobs + export_progress.successful_blobs
            }
            striped
            animated
          >
            <Progress.Label mb="2">
              Export progress:
              {export_progress.successful_blobs > 0 &&
                export_progress.total > 0 &&
                ` ${export_progress.successful_blobs}/${export_progress.total} blobs`}
              <InfoTip>
                We're collecting your missing blobs from your origin PDS, this
                might take a while
              </InfoTip>
            </Progress.Label>
            <Progress.Track>
              <Progress.Range />
            </Progress.Track>
          </Progress.Root>
        );
      case STAGES.MISSING_BLOBS_IMPORT:
        if (!upload_progress) return null;

        return (
          <Progress.Root
            width="100%"
            max={upload_progress?.total}
            min={0}
            value={
              upload_progress.invalid_blobs + upload_progress.successful_blobs
            }
            striped
            animated
          >
            <Progress.Label mb="2">
              Import progress:
              {upload_progress.successful_blobs > 0 &&
                upload_progress.total > 0 &&
                ` ${upload_progress.successful_blobs}/${upload_progress.total} blobs`}
              <InfoTip>
                We're importing your missing blobs to Northsky, this might take
                a while
              </InfoTip>
            </Progress.Label>
            <Progress.Track>
              <Progress.Range />
            </Progress.Track>
          </Progress.Root>
        );
    }

    return null;
  };

  // These stages are managed by the migrator app, so we trigger
  // them automatically (every 1 second) to move to the next stage
  useEffect(() => {
    (async () => {
      if (
        fetcher.state === "idle" &&
        !error &&
        [STAGES.MISSING_BLOBS_EXPORT, STAGES.MISSING_BLOBS_IMPORT].includes(
          stage
        )
      ) {
        setTimeout(async () => {
          await fetcher.submit({}, { method: "post" });
        }, 1000);
      }
    })();
  }, [fetcher, stage, error]);

  return (
    <fetcher.Form method="post" style={{ width: "100%" }}>
      <VStack mb="5" width="100%">
        <VStack
          margin="0 auto"
          maxWidth={"350px"}
          height={"70vh"}
          justifyContent={"space-evenly"}
          alignItems={"center"}
        >
          <Heading size="3xl" letterSpacing="tight" textAlign={"center"}>
            Recovering blobs....
          </Heading>
          <Text fontSize="md" textAlign={"justify"}>
            Your missing blobs are being recovered
          </Text>
          <img
            alt="A clock by artist Katie Tightpussy"
            src={clock_art}
            className="katie-clock"
          />

          <Progress.Root
            width="100%"
            max={2}
            min={0}
            value={stageIdx}
            striped
            animated
          >
            <Progress.Label mb="2">
              Stage {stageIdx + 1} of 2: {stageTitle}
              <InfoTip>{stageDescription}</InfoTip>
            </Progress.Label>
            <Progress.Track>
              <Progress.Range />
            </Progress.Track>
          </Progress.Root>

          {getSecondaryProgressBar()}

          {error && (
            <>
              <Text fontSize="md" color="red.500" textAlign="center">
                An error occurred while recovering your blobs. Please try again
                or contact support if the problem persists.
              </Text>
              <Button name="cancel" type="submit" value="cancel" mt="4">
              Cancel
              </Button>
            </>
          )}
        </VStack>
      </VStack>
    </fetcher.Form>
  );
}
