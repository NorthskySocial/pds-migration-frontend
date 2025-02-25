import "react-router";

declare module "react-router" {
  interface Register {
    params: Params;
  }
}

type Params = {
  "/": {};
  "/backup-your-data": {};
  "/new-account": {};
  "/connect-bluesky": {};
  "/validate-plc-token": {};
  "/migrate": {};
};