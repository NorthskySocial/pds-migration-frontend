import { EventEmitter } from "node:events";
import {
  SeedClient,
  TestNetworkNoAppView,
  TestPds,
  mockNetworkUtilities,
} from "@atproto/dev-env";
import "jest-puppeteer";
import "expect-puppeteer";
import { STAGES } from "../app/util/stages";

describe("account migration tool", () => {
  let originNetwork: TestNetworkNoAppView;
  let destPds: TestPds;

  let sc: SeedClient;
  let inviteCode: string;
  let alice: string;
  const mailCatcher = new EventEmitter();
  let _origSendMail;

  beforeAll(async () => {
    try {
      originNetwork = await TestNetworkNoAppView.create({
        dbPostgresSchema: "account_migration",
        pds: {
          devMode: true,
        },
      });

      const ctx = originNetwork.pds.ctx;
      const mailer = ctx.mailer;

      destPds = await TestPds.create({
        devMode: true,
        didPlcUrl: originNetwork.plc.url,
        inviteRequired: true,
      });

      mockNetworkUtilities(destPds);

      sc = originNetwork.getSeedClient();

      process.on("SIGINT", async function () {
        await destPds.close();
        await originNetwork.close();
        await browser.close();
        process.exit();
      });

      await originNetwork.processAll();

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

      const res = await destPds.getAgent().com.atproto.server.createInviteCode(
        { useCount: 5 },
        {
          encoding: "application/json",
          headers: destPds.adminAuthHeaders(),
        }
      );

      inviteCode = res.data.code;
    } catch (e) {
      console.error(e);
    }
  });

  afterAll(async () => {
    await destPds?.close();
    await originNetwork?.close();
  });

  test("happy path", async () => {
    console.log(STAGES.INVITE_CODE);
    await page.goto(
      `http://localhost:5173?destination=${destPds.url}&plc=${originNetwork.plc.url}`
    );
    await page.waitForSelector('[name="invite-code"]');
    await page.$eval('input[name="agree-to-tos"]', (e) => e.click());
    await page.type('[name="invite-code"]', inviteCode);
    await page.click('button[name="migrate"]');

    console.log(STAGES.BACKUP_NOTICE);
    await page.waitForSelector('input[name="confirm"]');
    await page.$eval('input[name="confirm"]', (e) => e.click());
    await page.click('button[type="submit"]');

    console.log(STAGES.ORIGIN_PDS_LOGIN);
    await page.waitForSelector('input[name="bsky-handle"]');
    await page.$eval('input[name="has-pds"]', (e) => e.click());
    await page.waitForSelector('input[name="pds"]');
    await page.$eval('input[name="pds"]', (el, [pds]) => (el.value = pds), [
      originNetwork.pds.url,
    ]);
    await page.type('input[name="bsky-handle"]', "alice.test");
    await page.type('input[name="bsky-password"]', "alice");
    await page.click('button[type="submit"]');

    console.log(STAGES.CREATE_DEST_ACCOUNT);
    await page.waitForSelector('input[name="handle"]');
    await page.type('input[name="handle"]', "new-alice");
    await page.type('input[name="password"]', "hunter7password");
    await page.type('input[name="password-repeat"]', "hunter7password");
    await page.click('button[type="submit"]');

    await page.waitForSelector('input[name="token_plc"]');

    await new Promise((res) => setTimeout(res, 1000));

    const res = await originNetwork.pds.ctx.accountManager.db.db
      .selectFrom("email_token")
      .selectAll()
      .where("did", "=", alice)
      .where("purpose", "=", "plc_operation")
      .executeTakeFirst();

    const plcToken = res?.token;
    console.log("PLC token: ", plcToken);

    await page.type('input[name="token_plc"]', plcToken!);

    await page.waitForSelector('button[type="submit"]');
    await page.click('button[type="submit"]');

    await page.waitForSelector('button[name="login-to-northsky"]');

    expect(page).toMatchTextContent(/Your data has been migrated successfully/);
  }, 120000);
});
