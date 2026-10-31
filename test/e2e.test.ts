import { EventEmitter } from "node:events";
import { SeedClient, TestNetworkNoAppView, TestPds, mockNetworkUtilities } from "@atproto/dev-env";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import puppeteer, { type Browser, type Page } from "puppeteer";

describe("account migration tool", () => {
  let originNetwork: TestNetworkNoAppView;
  let destPds: TestPds;
  let browser: Browser | undefined;
  let page: Page;

  let sc: SeedClient;
  let inviteCode: string;
  let alice: SeedClient["dids"]["alice"];
  const mailCatcher = new EventEmitter();
  let _origSendMail;

  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: false });
    page = await browser.newPage();

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
      },
    );

    inviteCode = res.data.code;
  }, 120_000);

  afterAll(async () => {
    await browser?.close();
    await destPds?.close();
    await originNetwork?.close();
  }, 120_000);

  it("happy path", async () => {
    await page.goto(
      `http://localhost:5173?destination=${destPds.url}&plc=${originNetwork.plc.url}`,
    );
    await page.waitForSelector('[name="invite-code"]');
    await page.locator('input[name="agree-to-tos"]').click();
    await page.type('[name="invite-code"]', inviteCode);
    await page.click('button[name="migrate"]');

    await page.waitForSelector('input[name="confirm"]');
    await page.locator('input[name="confirm"]').click();
    await page.click('button[type="submit"]');

    await page.waitForSelector('input[name="bsky-handle"]');
    await page.type('input[name="bsky-handle"]', "alice.test");
    await page.click('button[name="submit"][value="find-pds"]');

    await page.waitForSelector('input[name="bsky-password"]');
    expect(await page.$eval("body", (body) => body.textContent)).toContain(originNetwork.pds.url);
    await page.type('input[name="bsky-password"]', "alice");
    await page.click('button[name="submit"]');

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

    await page.type('input[name="token_plc"]', plcToken!);

    await page.waitForSelector('button[type="submit"]');
    await page.click('button[type="submit"]');

    await page.waitForSelector('button[name="login-to-northsky"]');

    expect(await page.$eval("body", (body) => body.textContent)).toMatch(
      /Your data has been migrated successfully/,
    );
  }, 120000);
});
