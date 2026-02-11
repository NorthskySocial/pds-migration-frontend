import { type AtpAgent } from "@atproto/api";
import { once, EventEmitter } from "node:events";
import {
  SeedClient,
  TestNetworkNoAppView,
  TestPds,
  mockNetworkUtilities,
} from "@atproto/dev-env";
import Mail from "nodemailer/lib/mailer";
import inquirer from "inquirer";
import niceware from "niceware";

const originNetwork = await TestNetworkNoAppView.create({
  dbPostgresSchema: "account_migration",
  pds: {
    devMode: true,
    hostname: "localhost",
    port: 5566,
  },
  plc: {
    port: 5555,
  },
});
const destPds = await TestPds.create({
  devMode: true,
  didPlcUrl: originNetwork.plc.url,
  inviteRequired: true,
  hostname: "localhost",
  port: 5577,
});

const sc = originNetwork.getSeedClient();
const mailCatcher = new EventEmitter();

const ctx = originNetwork.pds.ctx;
const mailer = ctx.mailer;

mockNetworkUtilities(destPds);

process.on("SIGINT", async function () {
  await destPds.close();
  await originNetwork.close();
  process.exit();
});

await originNetwork.processAll();

// Catch emails for use in tests
const _origSendMail = mailer.transporter.sendMail;

mailer.transporter.sendMail = async (opts) => {
  const result = await _origSendMail.call(mailer.transporter, opts);
  mailCatcher.emit("mail", opts);
  return result;
};

const getTokenFromMail = (mail: Mail.Options) =>
  mail.html?.toString().match(/>([a-z0-9]{5}-[a-z0-9]{5})</i)?.[1];

mailCatcher.on("mail", (mail) =>
  console.log(
    "\n\n**NEW PLC TOKEN ARRIVED VIA EMAIL**: ",
    getTokenFromMail(mail),
    "\n\n"
  )
);

async function main() {
  const { menu } = await inquirer.prompt([
    {
      type: "list",
      name: "menu",
      message: "Make a selection",
      choices: [
        { name: "Generate invite code on PDS 2", value: "invite_code" },
        { name: "Create test account on PDS 1", value: "create_1" },
      ],
    },
  ]);

  switch (menu) {
    case "invite_code": {
      const res = await destPds.getClient().com.atproto.server.createInviteCode(
        { useCount: 1 },
        {
          encoding: "application/json",
          headers: destPds.adminAuthHeaders(),
        }
      );

      const inviteCode = res.data.code;
      console.info(`New invite code: ${inviteCode}`);

      break;
    }

    case "create_1": {
      const username = niceware.generatePassphrase(2);
      const res = await sc.createAccount(username, {
        handle: `${username}.test`,
        email: `${username}@test.com`,
        password: "password",
      });

      console.table([res], ["handle", "did", "password"]);
      break;
    }
  }

  main(); // return to main menu
}
main();
