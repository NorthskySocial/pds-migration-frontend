"use client";

import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { ColorModeProvider, type ColorModeProviderProps } from "./color-mode";
import { system } from "@ProjectNorthwoods/northwoods-ui/src/theme";

export function Provider(props: ColorModeProviderProps) {
  return (
    <ChakraProvider value={system}>
      {/* This is causing hydration mismatch errors */}
      {/* <ColorModeProvider {...props} /> */}
      {props.children}
    </ChakraProvider>
  );
}
