function sleep(time) {
  return new Promise(function (resolve, reject) {
    setTimeout(resolve, time);
  });
}

describe("NearPlace", function() {
  let contract;
  let accountId;

  beforeAll(async function() {
      const config = await nearlib.dev.getConfig();
      near = await nearlib.dev.connect();
      accountId = nearlib.dev.myAccountId;
      const url = new URL(window.location.href);
      config.contractName = url.searchParams.get("contractName");
      console.log("nearConfig", config);
      await sleep(1000);
      contract = await near.loadContract(config.contractName, {
        // NOTE: This configuration only needed while NEAR is still in development
        viewMethods: ["getMap"],
        changeMethods: ["setCoords"],
        sender: accountId
      });
  });

  describe("getMap", function() {
    it("can get the board state", async function() {
      const viewResult = await contract.getMap({});
      expect(viewResult.length).toBe(100); // board is 10 by 10
    });
  });
});