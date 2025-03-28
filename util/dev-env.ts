import {
  SeedClient,
  TestNetworkNoAppView,
  TestPds,
  mockNetworkUtilities,
} from "@atproto/dev-env";
import Mail from "nodemailer/lib/mailer";
import { once, EventEmitter } from "node:events";
import { Secp256k1Keypair } from "@atproto/crypto";
let network: TestNetworkNoAppView;
let newPds: TestPds;
let alice: string;
let sc: SeedClient;
const mailCatcher = new EventEmitter();
let _origSendMail;
let sampleKey: string;

export const main = async () => {
  const getMailFrom = async (promise): Promise<Mail.Options> => {
    const result = await Promise.all([once(mailCatcher, "mail"), promise]);
    return result[0][0];
  };

  const getTokenFromMail = (mail: Mail.Options) =>
    mail.html?.toString().match(/>([a-z0-9]{5}-[a-z0-9]{5})</i)?.[1];

  network = await TestNetworkNoAppView.create({
    dbPostgresSchema: "account_migration",
    pds: {
      port: 8123,
      hostname: "k1xrpc41-8123.uks1.devtunnels.ms",
      serviceHandleDomains: [".k1xrpc41-8123.uks1.devtunnels.ms"],
    },
  });
  newPds = await TestPds.create({
    didPlcUrl: network.plc.url,
    inviteRequired: true,
    port: 9123,
    serviceHandleDomains: [".northsky.social"],
    hostname: "k1xrpc41-9123.uks1.devtunnels.ms",
  });

  process.on("SIGINT", async function () {
    await newPds.close();
    await network.close();
    process.exit();
  });

  const ctx = network.pds.ctx;
  const mailer = ctx.mailer;
  sampleKey = (await Secp256k1Keypair.create()).did();

  // Catch emails for use in tests
  _origSendMail = mailer.transporter.sendMail;
  mailer.transporter.sendMail = async (opts) => {
    const result = await _origSendMail.call(mailer.transporter, opts);
    mailCatcher.emit("mail", opts);
    return result;
  };

  mockNetworkUtilities(newPds);

  sc = network.getSeedClient();

  await network.processAll();

  await sc.createAccount("alice", {
    handle: "alice.k1xrpc41-8123.uks1.devtunnels.ms",
    email: "alice@test.com",
    password: "alice",
  });

  alice = sc.dids.alice;

  console.log(sc.dids.alice);

  const res = await newPds.getClient().com.atproto.server.createInviteCode(
    { useCount: 5 },
    {
      encoding: "application/json",
      headers: network.pds.adminAuthHeaders(),
    }
  );

  console.log(res.data.code);

  //   const mail = await getMailFrom(
  //     sc.agent.com.atproto.identity.requestPlcOperationSignature(undefined, {
  //       headers: sc.getHeaders(alice),
  //     })
  //   );

  //   const gotToken = getTokenFromMail(mail);
  //   console.log(gotToken);
  //   console.log(sampleKey);
  return async () => {
    await newPds.close();
    await network.close();
  };
};
