import { Heading, Text, Progress, VStack, Button } from "@chakra-ui/react";
import clock_art from "../assets/KTPClock.gif";
import { InfoTip } from "@/components/ui/toggle-tip";
import type { ScreenProps } from "~/util/stages";
import { useFetcher } from "react-router";
import { stageInfo, STAGES } from "~/util/stages";
import { useEffect } from "react";

export default function MigrationProgressScreen({
  stage,
  state: { export_progress, upload_progress },
  error,
}: ScreenProps) {
  const fetcher = useFetcher();
  if (!stage) throw new Error("Invalid stage received");

  const { stageIdx, stageTitle, stageDescription } = stageInfo[stage];

  const getSecondaryProgressBar = () => {
    switch (stage) {
      case STAGES.EXPORT_BLOBS_ORIGIN:
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
                {
                  stage === STAGES.EXPORT_BLOBS_ORIGIN && export_progress &&
                  export_progress.successful_blobs > 0 && export_progress.total > 0 &&
                  ` ${export_progress.successful_blobs}/${export_progress.total} blobs`
                }
                <InfoTip>We're collecting your blobs from your origin PDS, this might take a while</InfoTip>
              </Progress.Label>
              <Progress.Track>
                <Progress.Range />
              </Progress.Track>
            </Progress.Root>
          );
      case STAGES.IMPORT_BLOBS_DEST:
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
                {
                  stage === STAGES.IMPORT_BLOBS_DEST && upload_progress &&
                  upload_progress.successful_blobs > 0 && upload_progress.total > 0 &&
                  ` ${upload_progress.successful_blobs}/${upload_progress.total} blobs`
                }
                <InfoTip>We're importing your blobs to the Northsky PDS, this might take a while</InfoTip>
              </Progress.Label>
              <Progress.Track>
                <Progress.Range />
              </Progress.Track>
            </Progress.Root>
          );
    }

    return null;
  };

  // These stage are managed by the migrator app, so we trigger
  // them automatically (every 1 second) to move to the next stage
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
          1000
        );
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
              Migration stage {stageIdx + 1} of 6: {stageTitle}
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
                Please click the button below to resume the migration process.
                You can log in with your Bluesky and Northsky credentials to kick off
                the migration where it left off. If the problem persists, please
                contact support.
              </Text>
              <Button
                name="reset-resume"
                type="submit"
                value="reset-resume"
                mt="4"
              >
                Resume Failed Migration
              </Button>
            </>
          )}
        </VStack>
      </VStack>
    </fetcher.Form>
  );
}
