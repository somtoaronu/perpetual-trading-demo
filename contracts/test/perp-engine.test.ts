import { expect } from "chai";
import { ethers } from "hardhat";

describe("PerpEngine placeholder", () => {
  it("records deposits and emits intents", async () => {
    const [user] = await ethers.getSigners();

    const usdc = await ethers.deployContract("MockUSDC");
    const oracle = await ethers.deployContract("MockOracle", [3_200_000_000]);
    const engine = await ethers.deployContract("PerpEngine", [
      await usdc.getAddress(),
      await oracle.getAddress()
    ]);

    await usdc.mint(user.address, 1_000_000_000); // 1,000 USDC with 6 decimals
    await usdc.approve(await engine.getAddress(), 500_000_000);

    await expect(engine.deposit(500_000_000))
      .to.emit(engine, "CollateralDeposited")
      .withArgs(user.address, 500_000_000);

    expect(await engine.collateralBalances(user.address)).to.equal(500_000_000);

    const tx = await engine.openPosition(true, ethers.parseUnits("1", 18), 200_000_000, 5);
    const receipt = await tx.wait();
    const event = receipt!.logs.find((log) => log.fragment?.name === "PositionIntentSubmitted");
    expect(event).to.not.equal(undefined);
  });
});
