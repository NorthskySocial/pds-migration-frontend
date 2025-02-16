"use client";

import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { ColorModeProvider, type ColorModeProviderProps } from "./color-mode";

export function Provider(props: ColorModeProviderProps) {
  return (
    <ChakraProvider value={defaultSystem}>
      {/* This is causing hydration mismatch errors */}
      {/* <ColorModeProvider {...props} /> */}
      {props.children}
    </ChakraProvider>
  );
}
