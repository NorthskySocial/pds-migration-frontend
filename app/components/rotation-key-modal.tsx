import { Button, CloseButton, Dialog, Portal } from "@chakra-ui/react";
import { useCallback, useState } from "react";
import { Secp256k1Keypair } from "@atproto/crypto";

export const SuccessText = ({ keypair }: { keypair: Secp256k1Keypair }) => {
  const downloadKey = useCallback(async () => {
    const exported = await keypair.export();
    const blob = new Blob([exported.buffer], {
      type: "application/octet-stream",
    });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `${keypair.did()}.key`;
    document.body.appendChild(a);
    a.style.display = "none";
    a.click();
    a.remove();
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
  }, [keypair]);
  return (
    <>
      <p>You've successfully generated a key. Its DID is:</p>
      <h4>{keypair.did()}</h4>
      <Button onClick={downloadKey}>Download {keypair.did()}.key</Button>
      <p>
        You want to <u>securely</u> back this up <strong>right now</strong>.
      </p>
      <p>We recommend putting it into a password manager ASAP.</p>
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
    </>
  );
};

export const OpenRotationKeyModal = ({
  onClose,
}: {
  onClose: (key: Secp256k1Keypair) => void;
}) => {
  const [key, setKey] = useState<Secp256k1Keypair | null>(null);
  const generateKeypair = useCallback(async () => {
    const keypair = await Secp256k1Keypair.create({ exportable: true });
    setKey(keypair);
  }, []);
  const exit = useCallback(() => key && onClose(key), [key, onClose]);
  return (
    <Dialog.Root
      size="cover"
      motionPreset="slide-in-bottom"
      onExitComplete={exit}
    >
      <Dialog.Trigger asChild>
        <Button variant="outline" size="lg">
          Open rotation key tool
        </Button>
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
                <SuccessText keypair={key} />
              ) : (
                <Dialog.ActionTrigger onClick={generateKeypair} asChild>
                  <Button variant="outline"></Button>
                </Dialog.ActionTrigger>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <Button variant="outline">Done</Button>
              </Dialog.CloseTrigger>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};
