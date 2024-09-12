import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// const tokenAddress = "0xaDBA987955Eac146f1983062100046be46e632fA";

const MultisigModule = buildModule("MultisigModule", (m) => {
  const INITIAL_QUORUM = 2;
  const INITIAL_SIGNERS = [
    "0x1234567890123456789012345678901234567890",
    "0x2345678901234567890123456789012345678901",
  ];
  const save = m.contract("Multisig", [INITIAL_QUORUM, INITIAL_SIGNERS]);

  return { save };
});

export default MultisigModule;

// Deployed SaveERC20: 0x9e92DE115F6c5a66c77062434Fa4F787Fd32daa9
