import { type AtpAgent } from "@atproto/api";
import { once, EventEmitter } from "node:events";
import {
  SeedClient,
  TestNetworkNoAppView,
  TestPds,
  mockNetworkUtilities,
} from "@atproto/dev-env";
import "jest-puppeteer";
import "expect-puppeteer";

// import { Secp256k1Keypair } from "@atproto/crypto";
import Mail from "nodemailer/lib/mailer";

describe("account migration tool", () => {
  let network: TestNetworkNoAppView;
  let newPds: TestPds;

  let sc: SeedClient;
  let oldAgent: AtpAgent;
  let newAgent: AtpAgent;
  let inviteCode: string;
  let alice: string;
  const mailCatcher = new EventEmitter();
  let _origSendMail;

  // let sampleKey: string;

  beforeAll(async () => {
    try {
      network = await TestNetworkNoAppView.create({
        dbPostgresSchema: "account_migration",
        pds: {
          port: 6789,
        },
        plc: {
          port: 8789,
        },
      });

      const ctx = network.pds.ctx;
      const mailer = ctx.mailer;

      newPds = await TestPds.create({
        didPlcUrl: network.plc.url,
        inviteRequired: true,
        port: 7789,
      });
      mockNetworkUtilities(newPds);
      console.log(network.plc.url, network.plc.port);
      sc = network.getSeedClient();
      oldAgent = network.pds.getClient();
      newAgent = newPds.getClient();

      await network.processAll();
      // sampleKey = (await Secp256k1Keypair.create()).did();

      process.on("SIGINT", async function () {
        await newPds.close();
        await network.close();
        await browser.close();
        process.exit();
      });

      // Catch emails for use in tests
      _origSendMail = mailer.transporter.sendMail;
      mailer.transporter.sendMail = async (opts) => {
        const result = await _origSendMail.call(mailer.transporter, opts);
        mailCatcher.emit("mail", opts);
        return result;
      };

      await sc.createAccount("alice", {
        handle: "alice.test",
        email: "alice@test.com",
        password: "alice",
      });

      alice = sc.dids.alice;

      // await oldAgent.login({
      //   identifier: sc.accounts[alice].handle,
      //   password: sc.accounts[alice].password,
      // });

      const res = await network.pds
        .getClient()
        .com.atproto.server.createInviteCode(
          { useCount: 5, forAccount: alice },
          {
            encoding: "application/json",
            headers: network.pds.adminAuthHeaders(),
          }
        );

      inviteCode = res.data.code;
    } catch (e) {
      console.error(e);
    }
  });

  const getMailFrom = async (promise): Promise<Mail.Options> => {
    const result = await Promise.all([once(mailCatcher, "mail"), promise]);
    return result[0][0];
  };

  const getTokenFromMail = (mail: Mail.Options) =>
    mail.html?.toString().match(/>([a-z0-9]{5}-[a-z0-9]{5})</i)?.[1];

  afterAll(async () => {
    await newPds.close();
    await network.close();
    await browser.close();
  });

  it("does the migrate account account journey", async () => {
    try {
      console.log(inviteCode);
      await page.goto("http://localhost:5173");
      await page.waitForSelector('[name="invite-code"]');
      await page.$eval('input[name="agree-to-tos"]', (e) => e.click());
      await page.type('[name="invite-code"]', inviteCode);

      const goToPage2 = page.waitForNavigation();
      await page.click('button[name="migrate"]');
      await goToPage2;
      await page.waitForSelector('input[name="confirm"]');
      await page.$eval('input[name="confirm"]', (e) => e.click());

      await page.waitForSelector('input[name="bsky-handle"]');
      await page.type('input[name="bsky-handle"]', "alice.test");
      await page.type('input[name="bsky-password"]', "alice");
      const gotoPage3 = page.waitForNavigation();
      await page.click('button[type="submit"]');
      await gotoPage3;

      await page.waitForSelector('input[name="handle"]');
      await page.type('input[name="handle"]', "alice.northsky.social");
      await page.type('input[name="password"]', "hunter7password");
      await page.type('input[name="password-repeat"]', "hunter7password");
      const gotoPage4 = page.waitForNavigation();
      await page.click('button[type="submit"]');
      await gotoPage4;

      // await page.waitForSelector("img.katie-clock");

      const mail = await getMailFrom(
        oldAgent.com.atproto.identity.requestPlcOperationSignature(undefined, {
          headers: sc.getHeaders(alice),
        })
      );

      const plcToken = getTokenFromMail(mail);

      const gotoPage5 = page.waitForNavigation();
      await gotoPage5;
      await page.waitForSelector('input[name="plc-token"]');
      await page.type('input[name="plc-token"]', plcToken);

      const gotoPage6 = page.waitForNavigation();
      await page.click('button[type="submit"]');
      await gotoPage6;
      await page.waitForSelector('input[name="login-to-northsky"]');

      expect(page).toMatchTextContent(
        "Your data has been migrated successfully."
      );
    } catch (e) {
      console.error(e);
    }
  }, 60000);
});
