import {
  Button,
  CloseButton,
  Dialog,
  Portal,
  Box,
  VStack,
  Float,
} from "@chakra-ui/react";
import {
  useCallback,
  useEffect,
  useState,
  type MouseEventHandler,
} from "react";
import { Secp256k1Keypair } from "@atproto/crypto";
import {
  type AutofillType,
  encodeOPSaveRequest,
  activateOPButton,
} from "@1password/save-button";
import * as bip39 from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import { Spoiler } from "@/components/ui/spoiler";

export const SuccessText = ({
  exit,
  keypair,
  did,
  handle,
}: {
  exit: MouseEventHandler<HTMLButtonElement>;
  keypair: Secp256k1Keypair;
  did: string;
  handle: string;
}) => {
  const [downloaded, setDownloaded] = useState(false);
  const [result, setResult] = useState<string>();

  useEffect(() => {
    keypair.export().then((ent) => {
      setResult(bip39.entropyToMnemonic(ent, wordlist));
    });
  }, [keypair]);

  useEffect(() => {
    activateOPButton();
  }, [result]);

  const downloadKey = useCallback(async () => {
    if (result) {
      const blob = new Blob([result], {
        type: "text/plain",
      });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${keypair.did()}_private.key`;
      document.body.appendChild(a);
      a.style.display = "none";
      a.click();
      a.remove();
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
        setDownloaded(true);
      }, 1000);
    }
  }, [keypair, result]);

  return result ? (
    <>
      <p>Here's a new recovery key. Its DID is:</p>

      <h4 style={{ padding: "1em" }}>{keypair.did()}</h4>
      <p>It is encrypted using the following passphrase (hover to reveal):</p>
      <br></br>
      <Spoiler>
        <pre style={{ textAlign: "center", padding: "1em" }}>
          {result
            ?.split(" ")
            .map((v) => `${v}`)
            .join("\n")}
        </pre>
      </Spoiler>

      <h5 style={{ padding: "1em", textAlign: "center" }}>
        Save the word passphrase somewhere secure IMMEDIATELY. Ideally you
        should write it down on a piece of paper so it isn't saved anywhere
        online. This passphrase is required if you ever need to recover your
        account.
      </h5>
      <p>
        Again: the key can't be recovered without the above collection of words!
      </p>
      <p>
        We're really paranoid about this because you can be impersonated if your
        key falls into the wrong hands.{" "}
        <strong>
          We don't hold a copy of this anywhere. It has been generated entirely
          on this device.
        </strong>{" "}
        If you lose the passphrase but still have access to Northsky, you can
        always generate a new one! But if you lose access to Northsky as well as
        this key, you may not be able to recover your account.
      </p>
      <Button
        variant="solid"
        colorPalette={"purple"}
        style={{ margin: "1em 0" }}
        onClick={downloadKey}
      >
        Download {keypair.did()}.key
      </Button>
      <p>
        You want to <u>securely</u> back this up <strong>right now</strong>.
      </p>
      <p>We recommend putting it into a password manager ASAP.</p>

      <Box
        mb="3"
        background={"purple.300"}
        maxW="sm"
        color="fg"
        p="2"
        borderRadius={"2xl"}
      >
        <VStack align={"center"}>
          {/* @ts-expect-error Custom Element */}
          <onepassword-save-button
            data-onepassword-type="login"
            value={encodeOPSaveRequest({
              title: handle
                ? `Recovery key for ${handle}: ${keypair.did()}`
                : `Recovery key ${keypair.did()}`,
              fields: [
                { autocomplete: "username" as AutofillType, value: did },
                {
                  autocomplete: "nickname" as AutofillType,
                  value: handle,
                },
                {
                  autocomplete: "recovery-code" as AutofillType,
                  value: result,
                },
              ],
              notes: `Generated ${new Date().toISOString()} by Northsky Migrator}`,
            })}
            lang="en"
          />
        </VStack>
      </Box>

      <p>
        <strong>
          If you lose this key, you won't lose access to your account, but if it
          falls into the wrong hands your account can be taken over.{" "}
          <u>
            Be careful. Once you've put it somewhere secure, make sure to delete
            any insecure copies on your harddrive or on your phone's SD card.
          </u>
        </strong>
      </p>

      {downloaded && (
        <Button
          variant="solid"
          colorPalette={"purple"}
          size="lg"
          onClick={exit}
        >
          Continue
        </Button>
      )}
      <Float>
        <CloseButton
          variant="solid"
          colorPalette={"purple"}
          size="lg"
          onClick={exit}
        ></CloseButton>
      </Float>
    </>
  ) : (
    <strong>An error has occurred.</strong>
  );
};

export const OpenRotationKeyModal = ({
  onClose,
  did,
  handle,
}: {
  did: string;
  handle: string;
  onClose: (key: Secp256k1Keypair) => void;
}) => {
  const [key, setKey] = useState<Secp256k1Keypair | null>(null);
  useEffect(() => {
    Secp256k1Keypair.create({ exportable: true }).then(setKey);
  }, []);

  const exit = useCallback(() => key && onClose(key), [key, onClose]);
  return (
    <Dialog.Root
      size="cover"
      motionPreset="slide-in-bottom"
      onExitComplete={exit}
    >
      <Dialog.Trigger asChild>
        <Button size="lg">Open rotation key tool</Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Add rotation key</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              {key ? (
                <SuccessText
                  exit={exit}
                  did={did}
                  handle={handle}
                  keypair={key}
                />
              ) : null}
            </Dialog.Body>
            <Dialog.Footer>
              {/* <Dialog.CloseTrigger asChild>
                <Button variant="outline"></Button>
              </Dialog.CloseTrigger> */}
            </Dialog.Footer>
            {/* <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger> */}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};
