import { ethers } from "hardhat";

async function main() {
  // deployment
  const SIGNER = [
    // "0x22F95Be1bB437A3a390808e74cACaaAF3da2eaCd",
    "0x078013FA5f437c741d1F1AcBAd6c48d6d9ce87dC",
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", //fake address
  ];
  const multisigFactoryAddress = "0xdca2e589F5D41f709ca516866036F045CD4bcf50";
  const web3CXITokenAddress = "0x9D60c18e80eD8a2b6e4E5B443a9C19Bbb812EB1C";
  const QUORUM = 2;
  //   Localhost
  //   const multisigFactoryAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  //   const web3CXITokenAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  //   const [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();
  //   const SIGNER = [addr1, addr2, addr3];

  //   Lisk-sepolia
  // const multisigFactoryAddress = "0xBE03f15fB4a46Ab7E2b821b2228c1e067b792372";
  // const web3CXITokenAddress = "0x836207E3679531e2481Cf8d85dfB1ac75baf542C";

  const web3CXI = await ethers.getContractAt("IERC20", web3CXITokenAddress);

  const MultisigFactory = await ethers.getContractAt(
    "IMultisigFactory",
    multisigFactoryAddress
  );

  // Approve savings contract to spend token
  const approvalAmount = ethers.parseUnits("1000", 18);

  //   console.log("BAL:", await web3CXI.balanceOf(MultisigFactory));

  // Interaction
  await MultisigFactory.createMultisigWallet(QUORUM, SIGNER);
  const multisigAddress = await MultisigFactory.getMultiSigClones();

  console.log(
    "BAL:",
    await web3CXI.balanceOf(multisigAddress[multisigAddress.length - 1])
  );
  console.log(
    "WALLLET_BAL:",
    await web3CXI.balanceOf("0x22F95Be1bB437A3a390808e74cACaaAF3da2eaCd")
  );

  //   const approveTx = await web3CXI.transferFrom(
  //     "0x22F95Be1bB437A3a390808e74cACaaAF3da2eaCd",
  //     multisigAddress[multisigAddress.length - 1],
  //     approvalAmount
  //   );
  //   approveTx.wait();
  //   const appTrx = await web3CXI.approve(web3CXITokenAddress, approvalAmount);
  //   appTrx.wait();
  console.log(
    "BAL:",
    await web3CXI.balanceOf(multisigAddress[multisigAddress.length - 1])
  );

  console.log(multisigAddress);

  const multisig = await ethers.getContractAt(
    "IMultisig",
    multisigAddress[multisigAddress.length - 1]
  );

  const impersonatedAcc = await ethers.getImpersonatedSigner(
    "0x22F95Be1bB437A3a390808e74cACaaAF3da2eaCd"
  );

  const tx = await multisig
    .connect(impersonatedAcc)
    .transfer(
      ethers.parseUnits("10", 18),
      "0x078013FA5f437c741d1F1AcBAd6c48d6d9ce87dC",
      web3CXITokenAddress
    );
  tx.wait();

  console.log(tx);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
