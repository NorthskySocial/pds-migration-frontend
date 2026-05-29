import { data } from "react-router";
import { Heading, Text, VStack, Button } from "@chakra-ui/react";
import { Layout } from "~/components/layout";
import type { Route } from "./+types/not-found";

export function meta(_: Route.MetaArgs): ReturnType<Route.MetaFunction> {
  return [{ title: "Page not found" }];
}

export async function loader(_: Route.LoaderArgs) {
  throw data("Not Found", { status: 404 });
}

export default function NotFoundRoute() {
  return (
    <Layout>
      <NotFoundContent />
    </Layout>
  );
}

export function ErrorBoundary(_: Route.ErrorBoundaryProps) {
  return (
    <Layout>
      <NotFoundContent />
    </Layout>
  );
}

function NotFoundContent() {
  return (
    <VStack mb="5" width="100%" gap="4">
      <Heading size="4xl" letterSpacing="tight" textAlign="center">
        404
      </Heading>
      <Heading size="xl" letterSpacing="tight" textAlign="center">
        Page not found
      </Heading>
      <Text fontSize="md" textAlign="center">
        The page you're looking for doesn't exist or has been moved.
      </Text>
      <Button width="100%" onClick={() => (window.location.href = "/")}>
        Return home
      </Button>
    </VStack>
  );
}
