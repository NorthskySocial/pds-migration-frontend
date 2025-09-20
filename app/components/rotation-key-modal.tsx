import { Button, Dialog, Portal } from "@chakra-ui/react";
import {
  useCallback,
  useEffect,
  useState,
  type MouseEventHandler,
} from "react";
import { Secp256k1Keypair } from "@atproto/crypto";
import { type AutofillType, encodeOPSaveRequest } from "@1password/save-button";
import { encryptKey, toBase64 } from "~/util/crypto";

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
  const [result, setResult] = useState<{
    encrypted: ArrayBuffer | null;
    passphrase: string | null;
    salt: string | null;
  }>({
    encrypted: null,
    passphrase: null,
    salt: null,
  });

  useEffect(() => {
    encryptKey(keypair).then(setResult);
  }, [keypair]);

  const downloadKey = useCallback(async () => {
    if (result.encrypted) {
      const blob = new Blob([result.encrypted], {
        type: "application/octet-stream",
      });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${keypair.did()}_${result.salt}.key`;
      document.body.appendChild(a);
      a.style.display = "none";
      a.click();
      a.remove();
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
        setDownloaded(true);
      }, 1000);
    }
  }, [keypair, result.encrypted, result.salt]);

  return result.salt && result.encrypted && result.passphrase ? (
    <>
      <p>You've successfully generated a key. Its DID is:</p>
      <h4 style={{ padding: "1em" }}>{keypair.did()}</h4>
      <p>We've encrypted it using the following passphrase:</p>
      <pre style={{ textAlign: "center", padding: "1em" }}>
        {result.passphrase
          ?.split(" ")
          .map((v) => `${v}`)
          .join("\n")}
      </pre>
      <h5 style={{ padding: "1em", textAlign: "center" }}>
        WRITE THIS DOWN, IDEALLY ON A SHEET OF PAPER YOU CAN PUT SOMEWHERE SAFE
      </h5>
      <p>The key can't be recovered without the above collection of words!</p>
      <p>
        We're really paranoid about this because you can be impersonated if your
        key falls into the wrong hands.{" "}
        <strong>
          We don't hold a copy of this anywhere, and it's been generated
          entirely on this device.
        </strong>
        If you lose the passphrase but still have access to Northsky, you can
        always generate a new one! But if you lose access to Northsky as well as
        this key, you may not be able to recover your account.
      </p>
      <Button style={{ margin: "1em 0" }} onClick={downloadKey}>
        Download {keypair.did()}.key
      </Button>
      <p>
        You want to <u>securely</u> back this up <strong>right now</strong>.
      </p>
      <p>We recommend putting it into a password manager ASAP.</p>
      {/* @ts-expect-error Ambient module def not working */}
      <onepassword-save-button
        data-onepassword-type="login"
        value={encodeOPSaveRequest({
          title: `Recovery key for ${handle}: ${keypair.did()}`,
          fields: [
            { autocomplete: "username" as AutofillType, value: did },
            { autocomplete: "nickname" as AutofillType, value: handle },
            {
              autocomplete: "current-password" as AutofillType,
              value: toBase64(new Uint8Array(result.encrypted)),
            },
            {
              autocomplete: "one-time-code" as AutofillType,
              value: result.salt,
            },
            // {
            //   autocomplete: "one-time-code" as AutofillType,
            //   value: result.passphrase,
            // },
          ],
          notes: `Generated ${new Date().toISOString()} by Northsky Migrator.\n\nSalt: ${
            result.salt
          }`,
        })}
        lang="en"
      />
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
        <Button variant="outline" size="lg" onClick={exit}>
          Continue
        </Button>
      )}
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
  const generateKeypair = useCallback(async () => {
    const keypair = await Secp256k1Keypair.create({ exportable: true });
    setKey(keypair);
  }, [setKey]);

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
            <Dialog.Body style={{ background: "black" }}>
              {key ? (
                <SuccessText
                  exit={exit}
                  did={did}
                  handle={handle}
                  keypair={key}
                />
              ) : (
                <Button onClick={generateKeypair}>Generate new keypair</Button>
              )}
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
