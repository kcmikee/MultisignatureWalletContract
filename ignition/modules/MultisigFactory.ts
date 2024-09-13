import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// const tokenAddress = "0xaDBA987955Eac146f1983062100046be46e632fA";

const MultisigModule = buildModule("MultisigModule", (m) => {
  const save = m.contract("MultisigFactory");

  return { save };
});

export default MultisigModule;

// Deployed SaveERC20: 0x9e92DE115F6c5a66c77062434Fa4F787Fd32daa9

// Deployed multisig: 0x9D057aD123062870084d1c5961E67a127d68221a
// Deployed multisigfactory: 0xBE03f15fB4a46Ab7E2b821b2228c1e067b792372
