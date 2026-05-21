import { Alert, Button, Flex } from "@chakra-ui/react";
import type { ErrorType } from "~/sessions.server";

export const ErrorMessage = ({
  title = "Oh no!",
  children = "Your form has some errors. Please fix them and try again.",
  errorType,
  supportFormUrl,
}: {
  title?: string;
  children?: React.ReactNode;
  errorType?: ErrorType;
  supportFormUrl?: string;
}) => {
  const handleSupportClick = () => {
    if (supportFormUrl) {
      window.open(supportFormUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Alert.Root status="error">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{title}</Alert.Title>
        <Alert.Description>{children}</Alert.Description>
        {errorType === "Unexpected" && supportFormUrl && (
          <Flex justifyContent="center" mt={4}>
            <Button onClick={handleSupportClick}>
              Contact Support
            </Button>
          </Flex>
        )}
      </Alert.Content>
    </Alert.Root>
  );
};
