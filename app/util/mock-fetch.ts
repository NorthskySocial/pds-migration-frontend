import { logger } from "./logger";

const f = async (input: URL | string, init?: RequestInit) => {
  const { DEV } = import.meta.env;
  if (DEV && import.meta.env.MODE !== "test") {
    logger.log(new URL(input));
    switch (new URL(input).host) {
      case "pds-dest.aendra.dev": {
        switch (new URL(input).pathname) {
          case "/xrpc/com.atproto.server.createSession": {
            return new Response(
              JSON.stringify({
                accessJwt: "string",
                refreshJwt: "string",
                handle: "string.test",
                did: "did:plc:asd",
                didDoc: {
                  "@context": [
                    "https://www.w3.org/ns/did/v1",
                    "https://w3id.org/security/multikey/v1",
                    "https://w3id.org/security/suites/secp256k1-2019/v1",
                  ],
                  id: "did:plc:asd",
                  verificationMethod: [
                    {
                      id: "did:plc:abc#atproto",
                      type: "Multikey",
                      controller: "did:plc:xyz",
                      publicKeyMultibase: "...",
                    },
                  ],
                  service: [
                    {
                      id: "#atproto_pds",
                      type: "AtprotoPersonalDataServer",
                      serviceEndpoint: "https://example.com",
                    },
                  ],
                },
                email: "string",
                emailConfirmed: true,
                emailAuthFactor: true,
                active: true,
              }),
              { headers: { "Content-Type": "application/json" } }
            );
          }
          case "/xrpc/com.atproto.identity.resolveHandle":
            return new Response(
              JSON.stringify({ message: "Unable to resolve handle" }),
              {
                headers: { "Content-Type": "application/json" },
              }
            );
          default:
            return new Response(JSON.stringify({ ok: true }), {
              headers: { "Content-Type": "application/json" },
            });
        }
      }
      case "pds-origin.aendra.dev": {
        switch (new URL(input).pathname) {
          default:
            return new Response(JSON.stringify({ ok: true }), {
              headers: { "Content-Type": "application/json" },
            });
        }
      }
      case "localhost:9090": {
        switch (new URL(input).pathname) {
          default:
            return new Response(JSON.stringify({ ok: true }), {
              headers: { "Content-Type": "application/json" },
            });
        }
      }
      case "plc.directory": {
        switch (new URL(input).pathname) {
          default:
            return new Response(
              JSON.stringify({
                "@context": [
                  "https://www.w3.org/ns/did/v1",
                  "https://w3id.org/security/multikey/v1",
                  "https://w3id.org/security/suites/secp256k1-2019/v1",
                ],
                id: "did:plc:asd",
                verificationMethod: [
                  {
                    id: "did:plc:abc#atproto",
                    type: "Multikey",
                    controller: "did:plc:xyz",
                    publicKeyMultibase: "...",
                  },
                ],
                service: [
                  {
                    id: "#atproto_pds",
                    type: "AtprotoPersonalDataServer",
                    serviceEndpoint: "https://example.com",
                  },
                ],
              }),
              { headers: { "Content-Type": "application/json" } }
            );
        }
      }
      default: {
        switch (new URL(input).pathname) {
          case "/xrpc/com.atproto.server.createSession": {
            return new Response(
              JSON.stringify({
                accessJwt: "string",
                refreshJwt: "string",
                handle: "string.test",
                did: "did:plc:asd",
                didDoc: {
                  "@context": [
                    "https://www.w3.org/ns/did/v1",
                    "https://w3id.org/security/multikey/v1",
                    "https://w3id.org/security/suites/secp256k1-2019/v1",
                  ],
                  id: "did:plc:asd",
                  verificationMethod: [
                    {
                      id: "did:plc:abc#atproto",
                      type: "Multikey",
                      controller: "did:plc:xyz",
                      publicKeyMultibase: "...",
                    },
                  ],
                  service: [
                    {
                      id: "#atproto_pds",
                      type: "AtprotoPersonalDataServer",
                      serviceEndpoint: "https://example.com",
                    },
                  ],
                },
                email: "string",
                emailConfirmed: true,
                emailAuthFactor: true,
                active: true,
              }),
              { headers: { "Content-Type": "application/json" } }
            );
          }
        }
      }
    }

    return new Response();
  } else {
    return fetch(input, init);
  }
};

export default f;
