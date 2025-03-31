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
import Mail from "nodemailer/lib/mailer";

describe("account migration tool", () => {
  let originNetwork: TestNetworkNoAppView;
  let destPds: TestPds;

  let sc: SeedClient;
  let originAgent: AtpAgent;
  let inviteCode: string;
  let alice: string;
  const mailCatcher = new EventEmitter();
  let _origSendMail;

  // let sampleKey: string;

  beforeAll(async () => {
    originNetwork = await TestNetworkNoAppView.create({
      dbPostgresSchema: "account_migration",
    });

    const ctx = originNetwork.pds.ctx;
    const mailer = ctx.mailer;

    destPds = await TestPds.create({
      didPlcUrl: originNetwork.plc.url,
      inviteRequired: true,
    });

    mockNetworkUtilities(destPds);

    sc = originNetwork.getSeedClient();
    originAgent = originNetwork.pds.getClient();

    process.on("SIGINT", async function () {
      await destPds.close();
      await originNetwork.close();
      await browser.close();
      process.exit();
    });

    await originNetwork.processAll();
    // sampleKey = (await Secp256k1Keypair.create()).did();

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

    const res = await destPds.getClient().com.atproto.server.createInviteCode(
      { useCount: 5 },
      {
        encoding: "application/json",
        headers: originNetwork.pds.adminAuthHeaders(),
      }
    );

    inviteCode = res.data.code;
  });

  const getMailFrom = async (promise): Promise<Mail.Options> => {
    const result = await Promise.all([once(mailCatcher, "mail"), promise]);
    return result[0][0];
  };

  const getTokenFromMail = (mail: Mail.Options) =>
    mail.html?.toString().match(/>([a-z0-9]{5}-[a-z0-9]{5})</i)?.[1];

  afterAll(async () => {
    await destPds?.close();
    await originNetwork?.close();
    await browser?.close();
  });

  // This is a mess, if you have a better idea plmk
  it("does the migrate account account journey", async () => {
    try {
      await page.goto(
        `http://localhost:5173?destination=${destPds.url}&plc=${originNetwork.plc.url}`
      );
      await page.waitForSelector('[name="invite-code"]');
      await page.$eval('input[name="agree-to-tos"]', (e) => e.click());
      await page.type('[name="invite-code"]', inviteCode);
      const goToPage2 = page.waitForNavigation();
      await page.click('button[name="migrate"]');

      await goToPage2;
      await page.waitForSelector('input[name="confirm"]');
      await page.$eval('input[name="confirm"]', (e) => e.click());
      const gotoPage3 = page.waitForNavigation();
      await page.click('button[type="submit"]');

      await gotoPage3;
      await page.waitForSelector('input[name="bsky-handle"]');
      await page.$eval('input[name="has-pds"]', (e) => e.click());
      await page.$eval('input[name="pds"]', (el, [pds]) => (el.value = pds), [
        originNetwork.pds.url,
      ]);
      await page.type('input[name="bsky-handle"]', "alice.test");
      await page.type('input[name="bsky-password"]', "alice");
      const gotoPage4 = page.waitForNavigation();
      await page.click('button[type="submit"]');

      await gotoPage4;
      await page.waitForSelector('input[name="handle"]');
      await page.type('input[name="handle"]', "alice");
      await page.type('input[name="password"]', "hunter7password");
      await page.type('input[name="password-repeat"]', "hunter7password");
      const gotoPage5 = page.waitForNavigation();
      await page.click('button[type="submit"]');
      await gotoPage5;

      // await page.waitForSelector("img.katie-clock");

      const mail = await getMailFrom(
        originAgent.com.atproto.identity.requestPlcOperationSignature(
          undefined,
          {
            headers: sc.getHeaders(alice),
          }
        )
      );

      const plcToken = getTokenFromMail(mail);

      const gotoPage6 = page.waitForNavigation();
      await gotoPage6;
      await page.waitForSelector('input[name="plc-token"]');
      await page.type('input[name="plc-token"]', plcToken);

      const gotoPage7 = page.waitForNavigation();
      await page.click('button[type="submit"]');
      await gotoPage7;
      await page.waitForSelector('input[name="login-to-northsky"]');

      expect(page).toMatchTextContent(
        "Your data has been migrated successfully."
      );
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  }, 60000);
});
