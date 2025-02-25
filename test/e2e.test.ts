import { AtUri, AtpAgent } from "@atproto/api";
import {
  SeedClient,
  TestNetworkNoAppView,
  TestPds,
  mockNetworkUtilities,
} from "@atproto/dev-env";

describe("account migration tool", () => {
  let network: TestNetworkNoAppView;
  let newPds: TestPds;

  let sc: SeedClient;
  let oldAgent: AtpAgent;
  let newAgent: AtpAgent;
  let adminAgent: AtpAgent;
  let inviteCode: string;
  let alice: string;

  beforeAll(async () => {
    network = await TestNetworkNoAppView.create({
      dbPostgresSchema: "account_migration",
      pds: {
        port: 6666,
      },
    });
    newPds = await TestPds.create({
      didPlcUrl: network.plc.url,
      inviteRequired: true,
      port: 7777,
    });
    mockNetworkUtilities(newPds);

    sc = network.getSeedClient();
    oldAgent = network.pds.getClient();
    newAgent = newPds.getClient();

    await network.processAll();

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
  });

  afterAll(async () => {
    await newPds.close();
    await network.close();
  });

  it("does the account account journey", () => {});
});
