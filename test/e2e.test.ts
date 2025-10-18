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
import { randomBytes } from "node:crypto";

const generateFakeUsername = () => randomBytes(4).toString("hex");

beforeAll(async () => {
  await Promise.all([
    (async () => {
      let i = 0;
      do {
        try {
          expect(
            await fetch("http://localhost:9090/health").then((r) => r.text())
          ).toEqual("OK");
          console.info("Backend service is online");
          break;
        } catch {
          i++;
          await new Promise((r) => setTimeout(r, 250));
        }
      } while (i < 10);
    })(),
    (async () => {
      let i = 0;
      do {
        try {
          const ready = await fetch("http://localhost:5173");
          expect(ready.ok).toBeTruthy();
          console.info("Frontend service is online");
          break;
        } catch {
          i++;
          await new Promise((r) => setTimeout(r, 250));
        }
      } while (i < 10);
    })(),
  ]);
}, 60000);

describe("account migration tool", () => {
  let originNetwork: TestNetworkNoAppView;
  let destPds: TestPds;
  let srcPds: TestPds;
  let sc: SeedClient;

  beforeAll(async () => {
    try {
      originNetwork = await TestNetworkNoAppView.create({
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

      await originNetwork.processAll();

      console.info("PLC is online");

      srcPds = originNetwork.pds;
      console.info("Origin PDS is online");

      destPds = await TestPds.create({
        devMode: true,
        didPlcUrl: originNetwork.plc.url,
        inviteRequired: true,
        hostname: "localhost",
        port: 5577,
      });

      console.info("Destination PDS is online");

      mockNetworkUtilities(destPds);

      sc = originNetwork.getSeedClient();
    } catch (e) {
      console.error(e);
      process.exit();
    }
  });

  afterAll(async () => {
    await destPds.close();
    await originNetwork.close();
  });

  describe("happy paths", () => {
    describe("user creates new account", () => {
      test("without recovery key", async () => {
        const {
          data: { code: inviteCode },
        } = await destPds.getClient().com.atproto.server.createInviteCode(
          { useCount: 5 },
          {
            encoding: "application/json",
            headers: destPds.adminAuthHeaders(),
          }
        );

        console.log(STAGES.INVITE_CODE);
        await page.goto(`http://localhost:5173`);
        await page.waitForSelector('[name="invite-code"]');
        await page.$eval('input[name="agree-to-tos"]', (e) => e.click());
        await page.$eval('input[name="agree-to-privacy"]', (e) => e.click());
        await page.type('[name="invite-code"]', inviteCode);
        await page.click('button[name="create"]');

        console.log(STAGES.CREATE_DEST_ACCOUNT);
        const username = generateFakeUsername();
        await page.waitForSelector('input[name="handle"]');
        await page.type('input[name="email"]', `${username}@example.com`);
        await page.type('input[name="handle"]', `${username}-new`);
        await page.type('input[name="password"]', "passwordPasswordPassword");
        await page.type(
          'input[name="password-repeat"]',
          "passwordPasswordPassword"
        );
        await page.click('button[type="submit"]');

        console.log(STAGES.GENERATE_RECOVERY_KEY);
        await page.waitForSelector('button[name="continue"]');
        await page.click('button[name="continue"]');

        expect(page).toMatchTextContent("Welcome to Northsky!");
      });
    });

    test("user migrates without recovery key", async () => {
      const username = generateFakeUsername();
      const src = await sc.createAccount(username, {
        handle: `${username}.test`,
        email: `${username}@example.com`,
        password: "password",
      });

      const {
        data: { code: inviteCode },
      } = await destPds.getClient().com.atproto.server.createInviteCode(
        { useCount: 5 },
        {
          encoding: "application/json",
          headers: destPds.adminAuthHeaders(),
        }
      );

      console.log(STAGES.INVITE_CODE);
      await page.goto(`http://localhost:5173`);
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
      await page.type('input[name="bsky-handle"]', `${username}.test`);
      await page.type('input[name="bsky-password"]', "password");
      await page.click('button[type="submit"]');

      console.log(STAGES.CREATE_DEST_ACCOUNT);
      await page.waitForSelector('input[name="handle"]');
      await page.type('input[name="handle"]', `${username}-new`);
      await page.type('input[name="password"]', "hunter7password");
      await page.type('input[name="password-repeat"]', "hunter7password");
      await page.click('button[type="submit"]');

      console.log(STAGES.GENERATE_RECOVERY_KEY);
      await page.waitForSelector('button[name="continue"]');
      await page.click('button[name="continue"]');

      await page.waitForSelector('input[name="token_plc"]');

      const res = await originNetwork.pds.ctx.accountManager.db.db
        .selectFrom("email_token")
        .selectAll()
        .where("did", "=", src.did)
        .where("purpose", "=", "plc_operation")
        .executeTakeFirst();

      const plcToken = res?.token;
      console.log("PLC token: ", plcToken);

      await page.type('input[name="token_plc"]', plcToken!);

      await page.waitForSelector('button[type="submit"]');
      await page.click('button[type="submit"]');

      expect(page).toMatchTextContent(
        /Your data has been migrated successfully/
      );
    });
  });
});
