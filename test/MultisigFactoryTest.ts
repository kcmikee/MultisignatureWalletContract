import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre, { ethers } from "hardhat";

describe("MultisigFactory", () => {
  async function deployMultisigFactory() {
    const [owner, otherAccount, addr1, addr2, addr3] =
      await ethers.getSigners();

    const MultisigFactory = await ethers.getContractFactory("MultisigFactory");
    const multisigFactory = await MultisigFactory.deploy();

    return { multisigFactory, owner, addr1, addr2, addr3 };
  }

  async function deployToken() {
    // Contracts are deployed using the first signer/account by default
    const Token = await ethers.getContractFactory("Web3CXI");
    const token = await Token.deploy();

    return { token };
  }

  async function deployMultisig() {
    const { token } = await loadFixture(deployToken);

    const [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();
    const Multisig = await ethers.getContractFactory("Multisig");
    const signers = [addr1.address, addr2.address];
    const multisig = await Multisig.deploy(2, signers);

    return { multisig, owner, addr1, addr2, addr3, addr4, token, signers };
  }

  describe("deploy factory contract", () => {
    it("should deploy contract", async () => {
      await loadFixture(deployMultisigFactory);
    });
  });

  describe("Token Deployment", function () {
    // Ensure that only the owner can mint new tokens
    it("Should make sure only owner can mint", async function () {
      const [owner, otherAccount] = await hre.ethers.getSigners();
      const { token } = await loadFixture(deployToken);
      const amount = ethers.parseUnits("500", 18);

      // Expect minting from a non-owner account to fail
      await expect(token.connect(otherAccount).mint(amount)).to.be.revertedWith(
        "you are not owner"
      );
    });
  });

  describe("contract deployment", () => {
    it("it should deploy", async () => {
      const { multisig, addr1, addr2 } = await loadFixture(deployMultisig);
    });

    it("qorum must be greater than 1", async () => {
      const { multisig, addr1, addr2 } = await loadFixture(deployMultisig);

      expect(await multisig.quorum()).to.be.greaterThan(1);
    });

    it("qorum must be less than valid signers", async () => {
      const { multisig, addr1, addr2 } = await loadFixture(deployMultisig);

      expect(await multisig.quorum()).to.be.lessThan(3);
    });

    it("user must be a valid signer", async () => {
      const { multisig, addr1, addr2, signers } = await loadFixture(
        deployMultisig
      );
      expect(await signers.includes(addr1.address)).to.be.true;
    });
  });

  describe("create multisig wallet", () => {
    it("should deploy contract", async () => {
      const { multisig, signers } = await loadFixture(deployMultisig);
      const { multisigFactory } = await loadFixture(deployMultisigFactory);

      expect(await multisigFactory.createMultisigWallet(2, signers));
      //  expect(await multisigFactory.getMultiSigClones());
      // console.log((await multisigFactory.getMultiSigClones()).length);
    });
    it("should get multisig contract", async () => {
      const { multisig, signers } = await loadFixture(deployMultisig);
      const { multisigFactory } = await loadFixture(deployMultisigFactory);

      expect(await multisigFactory.createMultisigWallet(2, signers));
      expect(
        (await multisigFactory.getMultiSigClones()).length
      ).to.be.greaterThan(0);
      console.log(await multisigFactory.getMultiSigClones());
    });
  });
});
