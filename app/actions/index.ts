export const loginOrigin = () => {
    const origin_agent = new AtpAgent({ service: pds_origin });

    const { data: agentSessionData } = await origin_agent.login({
        identifier: handle_origin!,
        password: password!,
    });

    try {
        const { did } = await(
            await fetch(
                `${pds_origin}/xrpc/com.atproto.identity.resolveHandle?handle=${handle_origin}`
            )
        ).json<{ did: string }>();

        if (!did || !handle_origin) {
            session.flash("error", "Invalid handle");

            // Redirect back to the login page with errors.
            return redirect("/connect-bluesky", {
                headers: {
                    "Set-Cookie": await commitSession(session),
                },
            });
        }

        session.set("did", did);

        const didDoc: DidDocument = await(
            await fetch(`${plc_hostname}/${did}`)
        ).json();

        console.log(didDoc);

        if (!didDoc || !isValidDidDoc(didDoc)) {
            // This might need rewriting
            session.flash("error", "PLC Directory unavailable; please try later.");

            // Redirect back to the login page with errors.
            return redirect("/connect-bluesky", {
                headers: {
                    "Set-Cookie": await commitSession(session),
                },
            });
        }

        const serviceEndpoint = getPdsEndpoint(didDoc) ?? pds_origin;

        session.set("pds_origin", serviceEndpoint);

        const { email, accessJwt: token_origin } = agentSessionData;
        session.set("email", email!); // ???
        session.set("token_origin", token_origin);
        console.log("service endpoint", serviceEndpoint);

        const pds_dest_uri = new URL(pds_dest);
        const aud = `did:web:${pds_dest_uri.host.replace(/:\d+/, "")}`;
        console.log(aud);
        const res = await fetch(
            `${context.cloudflare.env.MIGRATOR_BACKEND}/service-auth`,
            {
                headers: {
                    "Content-Type": "application/json",
                },
                method: "post",
                body: JSON.stringify({
                    pds_host: serviceEndpoint,
                    did,
                    token: token_origin,
                    aud,
                }),
            }
        );

        if (!res.ok) {
            console.error(res.statusText);
            session.flash(
                "error",
                `Invalid service token received; please contact support with error: ${res.statusText}`
            );

            // Redirect back to the login page with errors.
            return redirect("/connect-bluesky", {
                headers: {
                    "Set-Cookie": await commitSession(session),
                },
            });
        }

        const token = (await res.json()) as string;

        session.set("token_service", token);
        session.set("handle_origin", handle_origin);

        // Login succeeded, send them to the home page.
        return redirect("/new-account", {
            headers: {
                "Set-Cookie": await commitSession(session),
            },
        });
    }
}

export const createDestAccount = () => {
    console.log("PAGE 4");
    const { MIGRATOR_BACKEND } = context.cloudflare.env;
    const session = await getSession(request.headers.get("Cookie"));
    const data = await request.formData();
    const pw_dest = (data.get("password") as string) ?? "";
    const pwConfirm = (data.get("password-confirm") as string) ?? "";
    const handle = ((data.get("handle") as string) ?? "").toLowerCase();
    const submitted = data.has("submit");
    const did = session.get("did") as string;
    const service_token = session.get("token_service") as string;
    const pds_dest = session.get("pds_dest") as string;
    const dest_hostname = new URL(pds_dest).host;
    const handle_dest = `${handle}.${dest_hostname}`;

    let res = {
        ok: true,
        handle: `${handle}.${dest_hostname}`,
        error_password_match: "",
        error_password_length: "",
        handle_available: null as null | boolean,
    };

    // Check passwords matching
    if (pw_dest !== pwConfirm && pw_dest.length && pwConfirm.length) {
        res = {
            ...res,
            ok: false,
            error_password_match: "Passwords do not match",
        };
    }

    // Check password length
    if (pw_dest?.length < 8 && pw_dest.length > 0) {
        res = {
            ...res,
            ok: false,
            error_password_length: "Password must be at least 8 characters",
        };
    }

    // Check handle availability
    if (handle.length > 0) {
        const handle_available = await fetch(
            `${pds_dest}/xrpc/com.atproto.identity.resolveHandle?handle=${handle_dest}`
        )
            .then<{ message: string; error: string } & { did: string }>((r) =>
                r.json()
            )
            .then((d) => d.message === "Unable to resolve handle" || d.did === did);

        res = {
            ...res,
            handle_available,
        };
    }

    if (submitted && res.ok) {
        session.set("handle_dest", handle_dest);

        const inviteCode = session.get("inviteCode");

        if (!inviteCode) {
            session.flash("error", "Invalid invite code");

            // Redirect back to the login page with errors.
            return redirect("/", {
                headers: {
                    "Set-Cookie": await commitSession(session),
                },
            });
        }

        const email = session.get("email");
        const body = {
            pds_host: pds_dest,
            handle: handle_dest,
            token: service_token,
            password: pw_dest,
            email,
            did,
            invite_code: inviteCode,
        };
        console.log(body);

        const createAccountRes = await fetch(`${MIGRATOR_BACKEND}/create-account`, {
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        console.log("wheee", createAccountRes);

        if (!createAccountRes.ok) {
            const message = createAccountRes.statusText;

            session.flash("error", message);

            // Redirect back to the login page with errors.
            return redirect("/", {
                headers: {
                    "Set-Cookie": await commitSession(session),
                },
            });
        }

        // Get new user token
        const agent_dest = new AtpAgent({ service: pds_dest });

        const { data } = await agent_dest.login({
            identifier: handle_dest,
            password: pw_dest,
        });

        session.set("token_dest", data.accessJwt);

        // All good! Go to migrator!
        return redirect("/migrate", {
            headers: {
                "Set-Cookie": await commitSession(session),
            },
        });
    }
}


export async function migrate({ request, context }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const pds_origin = session.get("pds_origin") as string;
  const pds_dest = session.get("pds_dest") as string;
  const did = session.get("did") as string;
  const token_dest = session.get("token_dest") as string;
  const token_origin = session.get("token_origin") as string;

  const progress = session.get("progress") || defaultProgress;
  console.log(`PAGE 6, STAGE ${progress.stageIdx}`);

  if (!pds_origin || !did) {
    session.flash(
      "error",
      "Unable to resolve old account; please login again."
    );

    // Redirect back to the login page with errors.
    return redirect("/connect-bluesky", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }

  switch (progress.stageIdx + 1) {
    case 0:
    default: {
      session.flash("progress", {
        stageTitle: "Starting migration...",
        stageDescription: "Migration is beginning. Please wait.",
        stageIdx: 0,
      });
      break;
    }
    case 1: {
      // export repo
      const res = await fetch(
        `${context.cloudflare.env.MIGRATOR_BACKEND}/export-repo`,
        {
          method: "post",
          body: JSON.stringify({
            pds_host: pds_origin,
            did,
            token: token_origin,
          }),
        }
      );

      if (!res.ok) {
        session.flash("error", (await res.json<{ message: string }>()).message);
        break;
      }

      session.flash("progress", {
        stageIdx: 1,
        stageTitle: "Exporting your old account data...",
        stageDescription:
          "Copying your account data from your old PDS to Northsky",
      });

      break;
    }

    case 2: {
      // import repo
      const res = await fetch(
        `${context.cloudflare.env.MIGRATOR_BACKEND}/import-repo`,
        {
          method: "post",
          body: JSON.stringify({
            pds_host: pds_dest,
            did,
            token: token_dest,
          }),
        }
      );

      if (!res.ok) {
        session.flash("error", (await res.json<{ message: string }>()).message);
        break;
      }

      session.flash("progress", {
        stageIdx: 2,
        stageTitle: "Importing your account data...",
        stageDescription:
          "Copying your account data from your old PDS to Northsky",
      });

      break;
    }

    case 3: {
      // missing blobs
      const res = await fetch(
        `${context.cloudflare.env.MIGRATOR_BACKEND}/export-blobs`,
        {
          method: "post",
          body: JSON.stringify({
            did,
            destination: pds_dest,
            destination_token: token_dest,
            origin: pds_origin,
            origin_token: token_origin,
          }),
        }
      );

      if (!res.ok) {
        session.flash("error", (await res.json<{ message: string }>()).message);
        break;
      }

      session.flash("progress", {
        stageIdx: 3,
        stageTitle: "Exporting your old account blobs...",
        stageDescription: "Copying your blobs from your old PDS to Northsky",
      });
      break;
    }

    case 4: {
      // upload blobs
      const res = await fetch(
        `${context.cloudflare.env.MIGRATOR_BACKEND}/upload-blobs`,
        {
          method: "post",
          body: JSON.stringify({
            pds_host: pds_dest,
            did,
            token: token_dest,
          }),
        }
      );

      if (!res.ok) {
        session.flash("error", (await res.json<{ message: string }>()).message);
        break;
      }

      session.flash("progress", {
        stageIdx: 4,
        stageTitle: "Exporting your old account blobs...",
        stageDescription: "Copying your blobs from your old PDS to Northsky",
      });
      break;
    }

    case 5: {
      // migrate preferences
      const res = await fetch(
        `${context.cloudflare.env.MIGRATOR_BACKEND}/migrate-preferences`,
        {
          method: "post",
          body: JSON.stringify({
            did,
            destination: pds_dest,
            destination_token: token_dest,
            origin: pds_origin,
            origin_token: token_origin,
          }),
        }
      );

      if (!res.ok) {
        session.flash("error", (await res.json<{ message: string }>()).message);
        break;
      }

      session.flash("progress", {
        stageIdx: 6,
        stageTitle: "Migrating your preferences",
        stageDescription: "Copying your preference data to Northsky",
      });

      break;
    }

    case 7: {
      // req PLC token
      const res = await fetch(
        `${context.cloudflare.env.MIGRATOR_BACKEND}/request-token`,
        {
          method: "post",
          body: JSON.stringify({
            pds_host: pds_origin,
            did,
            token: token_origin,
          }),
        }
      );

      if (!res.ok) {
        session.flash("error", (await res.json<{ message: string }>()).message);
        break;
      }

      session.flash("progress", {
        stageIdx: 7,
        stageTitle: "Requesting a PLC token",
        stageDescription:
          "Requesting a token to migrate your PLC data... Almost done!",
      });
      break;
    }

    case 8: {
      return redirect("/validate-plc-token", {
        headers: {
          "Set-Cookie": await commitSession(session),
        },
      });
    }
  }

  return redirect("/migrate", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

export const validate = () => {
  console.log("PAGE 5");
  const { MIGRATOR_BACKEND, PDS_HOSTNAME } = context;
  const data = await request.formData();
  const submitted = data.has("submit");
  const plcToken = data.get("plc-token") as string;

  if (submitted) {
    // activate new account
    fetch(`${MIGRATOR_BACKEND}/activate-account`, {
      method: "post",
      body: JSON.stringify({
        pds_host: PDS_HOSTNAME,
        handle: "<<new_handle>>",
        password: "<<new_password>>",
      }),
    });

    // deactivate old account
    fetch(`${MIGRATOR_BACKEND}/deactivate-account`, {
      method: "post",
      body: JSON.stringify({
        pds_host: "<<old_host>>",
        handle: "<<old_handle>>",
        password: "<<old_password>>",
      }),
    });

    // deactivate old account
    fetch(`${MIGRATOR_BACKEND}/migrate-plc`, {
      method: "post",
      body: JSON.stringify({
        new_pds_host: PDS_HOSTNAME,
        new_handle: "<<new_handle>>",
        new_password: "<<new_password>>",
        old_pds_host: "<<old_host>>",
        old_handle: "<<old_handle>>",
        old_password: "<<old_password>>",
        plc_signing_token: plcToken,
      }),
    });
    return redirect("/done");
  }
}