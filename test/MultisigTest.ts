import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre, { ethers } from "hardhat";

describe("Multisig", function () {
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

  describe("transfer", () => {
    // const { multisig, addr1, addr2, addr3, addr4, token } = await loadFixture(
    //   deployMultisig
    // );

    it("should revert if a zero address is passed as recipient or token address", async function () {
      const { multisig, addr1, addr2, token } = await loadFixture(
        deployMultisig
      );

      const amount = ethers.parseUnits("1");
      // Test zero address as recipient
      await expect(
        multisig
          .connect(addr1)
          .transfer(amount, ethers.ZeroAddress, token.getAddress())
      ).to.be.revertedWith("address zero found");
    });

    it("should mark addresses passed to the constructor as valid signers", async function () {
      // Check that the addresses passed during deployment are valid signers
      const { multisig, owner } = await loadFixture(deployMultisig);

      expect(await multisig.isValidSigner(owner.address)).to.be.true;
    });

    it("Should revert if sender is not a valid signer", async function () {
      const { multisig, signers, token, addr4, addr3 } = await loadFixture(
        deployMultisig
      );

      // Fund the multisig contract with ERC20 tokens
      await token.transfer(
        await multisig.getAddress(),
        ethers.parseUnits("1000")
      );

      await expect(
        multisig
          .connect(addr3)
          .transfer(
            ethers.parseUnits("1"),
            signers[1],
            await token.getAddress()
          )
      ).to.be.revertedWith("invalid signer");
    });

    it("Should revert on insufficient fund", async function () {
      const { multisig, signers, token, addr1 } = await loadFixture(
        deployMultisig
      );

      await expect(
        multisig
          .connect(addr1)
          .transfer(
            ethers.parseUnits("1"),
            signers[1],
            await token.getAddress()
          )
      ).to.be.revertedWith("insufficient funds");
    });

    it("Should revert on can't send zero amount", async function () {
      const { multisig, signers, token, addr1 } = await loadFixture(
        deployMultisig
      );

      await expect(
        multisig
          .connect(addr1)
          .transfer(
            ethers.parseUnits("0"),
            signers[1],
            await token.getAddress()
          )
      ).to.be.revertedWith("can't send zero amount");
    });

    it("Should create a new transaction", async function () {
      const { multisig, addr1, addr2, addr3, addr4, signers } =
        await loadFixture(deployMultisig);
      const { token } = await loadFixture(deployToken);

      const amount = ethers.parseUnits("10", 18);
      await multisig.transfer(amount, addr3, token.getAddress());
    });
  });

  // approveTx
  describe("approveTx", () => {
    it("Transactions should have one or more tx", async function () {
      const { multisig, owner, addr1, addr3, token, signers } =
        await loadFixture(deployMultisig);

      await token.transfer(
        await multisig.getAddress(),
        ethers.parseUnits("1000")
      );

      await expect(multisig.approveTx(1));
    });

    it("Transactions should fail", async function () {
      const { multisig, owner, addr1, addr3, token, signers } =
        await loadFixture(deployMultisig);

      await token.transfer(
        await multisig.getAddress(),
        ethers.parseUnits("1000")
      );

      await expect(multisig.approveTx(0)).to.revertedWith("invalid tx id");
    });

    it("Transactions should fail", async function () {
      const { multisig, owner, addr1, addr3, token, signers } =
        await loadFixture(deployMultisig);

      await token.transfer(
        await multisig.getAddress(),
        ethers.parseUnits("1000")
      );
      await token.transfer(await addr1.address, ethers.parseUnits("10000"));
    });
  });

  describe("proposeQuorum", () => {
    it("not a valid quorum", async () => {
      const { multisig, owner, addr1, addr3, token, signers } =
        await loadFixture(deployMultisig);

      await expect(multisig.proposeQuorum(0)).to.revertedWith("invalid quorum");
    });
    // it("quorumChangeInProgress should be", async () => {
    //   const { multisig, owner, addr1, addr3, token, signers } =
    //     await loadFixture(deployMultisig);
    //   await expect(multisig.quorumChangeInProgress).to.be.false;
    // });
  });
});
