import {
  Heading,
  Highlight,
  Text,
  Input,
  Button,
  Spinner,
  Image,
  VStack,
  HStack,
  Field,
  InputGroup,
} from "@chakra-ui/react";
//import { Field } from "@/components/ui/field";
//import { InputGroup } from "@/components/ui/input-group";
import {
  PasswordInput,
  PasswordStrengthMeter,
} from "@/components/ui/password-input";
import type { ScreenProps } from "~/util/stages";
import { useFetcher } from "react-router";
import { useState } from "react";
import { passwordStrength } from "check-password-strength";

export default function NewAccountScreen({ state }: ScreenProps) {
  const fetcher = useFetcher();
  const [pass, setPass] = useState("");
  const [passVerify, setPassVerify] = useState("");
  const { id: strength } = passwordStrength(pass);
  const inEmail = state.email;
  const inEmailValid = state.email.valid;
  const inHandle = state.handle_dest;
  const inHandleAvailable = state.handle_dest_available;
  const inPasswordMatch = state.password_match;
  const inPasswordShort = state.password_too_short;
  const handlePrint = inHandleAvailable && (inHandle.length > 0);

  //console.log("Fetcher at the top: ", fetcher);

  return (
    <fetcher.Form method="post">
      <VStack mb="5">
        <Heading size="3xl" textAlign={"center"} letterSpacing="tight">
          <Highlight query="New Account">

            {/* Display a different opening depending on whether we're creating a new account or migrating one */}
            {state.do_journey === "create"
              ? "Create New Account"
              : "Reserve New Account"}
          </Highlight>


        </Heading>
        {state.do_journey === "migrate" ? (
          <Text fontSize="md" textAlign={"justify"}>
            We'll need to give you a <strong>.northsky.social</strong> handle as
            part of the migration. If you have a custom domain handle, you can
            change it back right after the migration process is over.
          </Text>
        ) : (
          <Text fontSize="md" textAlign={"justify"}>
            You get a .northsky.social handle to get you started. If you want to
            use a custom domain handle, you can set that later.
          </Text>
        )}


        <Field.Root required>
          <Field.Label>
            E-Mail Address
            <Field.RequiredIndicator />
          </Field.Label>
          <Input name="email" required placeholder="user@example.com" />
          <Field.HelperText>
            Enter your e-mail address here
          </Field.HelperText>
          <Field.ErrorText />
        </Field.Root>

        <br />
        <Field.Root required invalid={!inHandleAvailable && inHandle.length > 0}>
          <Field.Label>
            New Handle
            <Field.RequiredIndicator />
          </Field.Label>
          <InputGroup endAddon=".northsky.social">
            <Input name="handle"
              onKeyDown={(event) => {
                if (!/[a-z0-9]/i.test(event.key)) {
                  return event.preventDefault();
                }
              }}
              onChange={(event) => {
                if (event.currentTarget.willValidate) {
                  fetcher.submit(event.currentTarget.form);
                }
              }}
              placeholder="username" />
          </InputGroup>

          <Field.HelperText>
            {handlePrint &&(
              `Congrats! 🎉 ${inHandle.toLowerCase()} is available!`)}
          </Field.HelperText>

          <Field.ErrorText>{!handlePrint &&
            `${inHandle.toLowerCase()} is not available!`}</Field.ErrorText>
          <div>
            {fetcher.state !== "idle" ? (
              <Spinner />
            ) : (
              fetcher.data?.handle_message
            )}
          </div>
        </Field.Root>
        <br />

        <Field.Root required invalid={inPasswordShort}>
          <Field.Label>
            Password
            <Field.RequiredIndicator />
          </Field.Label>
          <PasswordInput
            name="password"
            autoComplete="new-password"

            onChange={(event) => {
              setPass(event.target.value)
              if (event.currentTarget.willValidate) {
                fetcher.submit(event.currentTarget.form);
              }
            }}
            value={pass}

          />
          <PasswordStrengthMeter
            width="100%"
            value={pass.length > 0 ? strength + 1 : 0}
          />
          <Field.HelperText />
          <Field.ErrorText>{inPasswordShort && `Password needs to be at least 8 characters`}</Field.ErrorText>
        </Field.Root>

        <Field.Root required invalid={!inPasswordMatch}>
          <Field.Label>
            Re-Enter Password
            <Field.RequiredIndicator />
          </Field.Label>
          <PasswordInput
            name="password-repeat"
            autoComplete="new-password"

            onChange={(event) => {
              setPassVerify(event.target.value)
              if (event.currentTarget.willValidate) {
                fetcher.submit(event.currentTarget.form);
              }
            }}
            value={passVerify}
          />
          <Field.HelperText />
          <Field.ErrorText>{!inPasswordMatch && `Passwords do not match`}</Field.ErrorText>
        </Field.Root>

        <br />
        <HStack>
          <Button type="submit" name="submit" margin={"0 auto"}>
          {/* <Button type="submit" name="submit" margin={"0 auto"} disabled={inPasswordMatch||!inPasswordShort||inHandleAvailable||inEmailValid}> */}
            Continue
          </Button>
          <Button name="cancel" type="submit" value={"cancel"} formNoValidate>
            Cancel
          </Button>
        </HStack>
      </VStack>
    </fetcher.Form>
  );
}
