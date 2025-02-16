import type { Route } from "./+types/home";
import {
  Heading,
  Highlight,
  VStack,
  Text,
  Input,
  HStack,
  Button,
  Box,
  Container,
} from "@chakra-ui/react";
import { Checkbox } from "~/components/ui/checkbox";

export function loader() {
  return { name: "northwoods.social" };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return <h1>migration progress</h1>;
}
