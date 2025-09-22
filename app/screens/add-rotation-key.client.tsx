import { Heading, Highlight, Text, Button, Image, } from "@chakra-ui/react";
import type { ScreenProps } from "~/util/stages";
import { useFetcher } from "react-router";
import { OpenRotationKeyModal } from "~/components/rotation-key-modal";
import { useCallback, useState } from "react";
import { Secp256k1Keypair } from "@atproto/crypto";
import "@1password/save-button";

export default function EncourageBackupScreen({ state }: ScreenProps) {
  const fetcher = useFetcher();
  const [didKeyWizard, setDidKeyWizard] = useState(false);
  const modalClose = useCallback(
    async (keypair: Secp256k1Keypair) => {
      await fetcher.submit(
        { user_recover_key: keypair.did() },
        { method: "post" }
      );
      setDidKeyWizard(true);
    },
    [fetcher]
  );

  const continueMigration = useCallback(async () => {
    try {
      await fetcher.submit({ user_recover_key: null }, { method: "post" });
    } catch (e) {
      console.error(e);
    }
  }, [fetcher]);

  return (
    <fetcher.Form method="post">

      <Image height={"150px"} src="../../app/assets/Northsky-IconCentered-Color.png" alt="Northsky" />
      <Heading size="3xl" letterSpacing="tight" textAlign={"center"}>
        <Highlight query="your Data">Add a rotation key</Highlight>
      </Heading>
      <Text fontSize="md" textAlign={"justify"} mb="4">
        For peace of mind, add a <strong>rotation key</strong> that can be used
        to restore access to your account in case anything catastrophic ever
        happens to Northsky. Note,{" "}
        <strong>you should treat this key like a password</strong> because if
        someone gets access to it they can irrecoverably take over your account.
      </Text>

      <div>
        <OpenRotationKeyModal
          did={state.did}
          handle={state.handle}
          onClose={modalClose}
        />
        <br />
        <br />
        <Button
          size="lg"
          variant="outline"
          type="button"
          onClick={continueMigration}
          margin={"0 auto"}
        >
          {didKeyWizard
            ? "Continue"
            : "Continue without generating rotation key"}
        </Button>
      </div>
    </fetcher.Form>
  );
}
