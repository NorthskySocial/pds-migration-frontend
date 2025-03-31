import "react-router";

declare module "react-router" {
  interface Register {
    params: Params;
  }
}

type Params = {
  "/": {};
  "/backup-your-data": {};
  "/connect-bluesky": {};
  "/new-account": {};
  "/migrate": {};
  "/validate-plc-token": {};
  "/done": {};
};