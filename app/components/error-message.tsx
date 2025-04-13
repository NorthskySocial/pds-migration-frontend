import { Alert } from "@chakra-ui/react";

export const ErrorMessage = ({
  title = "Oh no!",
  children = "Your form has some errors. Please fix them and try again.",
}) => {
  return (
    <Alert.Root status="error">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{title}</Alert.Title>
        <Alert.Description>{children}</Alert.Description>
      </Alert.Content>
    </Alert.Root>
  );
};
