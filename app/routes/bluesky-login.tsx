import type { Route } from "./+types/home";
import { Heading, Highlight, Text, Input, Button } from "@chakra-ui/react";
import { Field } from "~/components/ui/field";
import { PasswordInput } from "~/components/ui/password-input";

export function loader() {
  return { name: "northwoods.social" };
}

export default function BlueskyConnect({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <Heading size="3xl" letterSpacing="tight">
        <Highlight query="to Bluesky">Login to Bluesky</Highlight>
      </Heading>
      <Text fontSize="md" textAlign={"center"}>
        <p>
          Please provide us with the following information so we can migrate
          your data.
        </p>
        <p>
          Bluesky will e-mail you as part of this process, so{" "}
          <strong>ensure your e-mail address is verified</strong> before
          starting migration.
        </p>
      </Text>
      <Field required label="Bluesky login">
        <Input name="bsky-handle" placeholder="username.bsky.social" />
      </Field>
      <Field required label="Bluesky password">
        <PasswordInput name="bsky-password" />
      </Field>
      <Button name="submit" type="submit">
        Continue
      </Button>
    </>
  );
}
