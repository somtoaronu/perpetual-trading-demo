import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with ${deployer.address}`);

  const mockUSDC = await ethers.deployContract("MockUSDC");
  await mockUSDC.waitForDeployment();
  console.log(`MockUSDC deployed at ${await mockUSDC.getAddress()}`);

  const mockOracle = await ethers.deployContract("MockOracle", [3_215_340_000]);
  await mockOracle.waitForDeployment();
  console.log(`MockOracle deployed at ${await mockOracle.getAddress()}`);

  const perpEngine = await ethers.deployContract("PerpEngine", [
    await mockUSDC.getAddress(),
    await mockOracle.getAddress()
  ]);
  await perpEngine.waitForDeployment();
  console.log(`PerpEngine deployed at ${await perpEngine.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
