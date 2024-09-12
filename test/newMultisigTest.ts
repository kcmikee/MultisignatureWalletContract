import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre, { ethers } from "hardhat";

// Describe block for the Multisig contract
describe("Multisig", function () {
  // Fixture for deploying a token contract
  async function deployToken() {
    // Get signers (accounts) and deploy the LayintonToken contract
    const [owner, otherAccount, addr1, addr2, addr3] =
      await hre.ethers.getSigners();
    const token = await hre.ethers.getContractFactory("MLToken");
    const tokenAddr = await token.deploy();
    return { tokenAddr };
  }

  // Fixture for deploying the multisig contract
  async function deployMultisigContract() {
    const quorum = 3;

    // Get signers (accounts) and deploy the Multisig contract
    const [owner, otherAccount, addr1, addr2, addr3] =
      await hre.ethers.getSigners();

    // Deploy the token contract as a prerequisite
    const { tokenAddr } = await loadFixture(deployToken);

    // Deploy the multisig contract with quorum and valid signers
    const Multisig = await hre.ethers.getContractFactory("NewMultisig");
    const multisig = await Multisig.deploy(quorum, [
      addr1.address,
      addr2.address,
    ]);

    return {
      multisig,
      quorum,
      tokenAddr,
      owner,
      otherAccount,
      addr1,
      addr2,
      addr3,
    };
  }

  // Token deployment tests
  describe("Token Deployment", function () {
    // Ensure that only the owner can mint new tokens
    it("Should make sure only owner can mint", async function () {
      const [owner, otherAccount, addr1, addr2, addr3] =
        await hre.ethers.getSigners();
      const { tokenAddr } = await loadFixture(deployToken);
      const amount = hre.ethers.parseUnits("500", 18);

      // Expect minting from a non-owner account to fail
      await expect(
        tokenAddr.connect(otherAccount).mint(amount)
      ).to.be.revertedWithCustomError(tokenAddr, "NotOwner");
    });
  });

  // Token minting tests
  describe("Token Deployment", function () {
    // Ensure that the correct amount of tokens are minted to the owner
    it("Should mint the right amount to the owner address", async function () {
      const [owner, otherAccount, addr1, addr2, addr3] =
        await hre.ethers.getSigners();
      const { tokenAddr } = await loadFixture(deployToken);
      const amount = hre.ethers.parseUnits("100000", 1);

      // Expect the mint event to be emitted successfully
      await expect(tokenAddr.mint(100000)).to.emit(tokenAddr, "MintSuccessful");

      // Check the owner's balance is correctly updated
      expect(await tokenAddr.balanceOf(owner.address)).to.equal(
        hre.ethers.parseUnits("600000", 18)
      );
    });
  });

  // Multisig deployment tests
  describe("Deployment", function () {
    // Ensure the correct quorum number is set
    it("Should set the right quorum number", async function () {
      const [owner, otherAccount, addr1, addr2, addr3] =
        await hre.ethers.getSigners();
      const { multisig } = await loadFixture(deployMultisigContract);

      // Check that the quorum is 3 as expected
      expect(await multisig.quorum()).to.equal(3);
    });

    // Ensure the correct number of valid signers is set
    it("Should set the right number of valid signers", async function () {
      const [owner, otherAccount, addr1, addr2, addr3] =
        await hre.ethers.getSigners();
      const { multisig } = await loadFixture(deployMultisigContract);

      // Check that the number of valid signers is 3
      expect(await multisig.noOfValidSigners()).to.equal(3);
    });

    // Ensure the owner is added to the valid signers if not done at deployment
    it("Should add owner to valid signer if not added at deployment", async function () {
      const [owner, otherAccount, addr1, addr2, addr3] =
        await hre.ethers.getSigners();
      const { multisig } = await loadFixture(deployMultisigContract);

      // Check that the owner is a valid signer
      expect(await multisig.getAVlaidSigner(owner.address)).to.equal(true);
    });
  });

  // Token transfer tests
  describe("Transfer", function () {
    // Ensure a transfer fails if the sender is not a valid signer
    it("Should revert if the sender is not a valid signer", async function () {
      const { multisig, tokenAddr, addr1, addr2, addr3 } = await loadFixture(
        deployMultisigContract
      );
      const amount = hre.ethers.parseUnits("20", 18);

      // Expect transfer to fail if the sender is not a valid signer
      await expect(
        multisig.connect(addr3).transfer(amount, addr1.address, tokenAddr)
      ).to.revertedWith("invalid signer");
    });

    // Ensure transfer fails when zero amount is sent
    it("Should revert when zero amount is sent", async function () {
      const { multisig, tokenAddr, addr1, addr2, addr3 } = await loadFixture(
        deployMultisigContract
      );
      const amount = hre.ethers.parseUnits("0", 18);

      // Expect transfer to fail if the amount is zero
      await expect(
        multisig.transfer(amount, addr1.address, tokenAddr)
      ).to.revertedWith("can't send zero amount");
    });

    // Ensure transfer fails if recipient address is zero
    it("Should revert if recipient address is zero", async function () {
      const { multisig, tokenAddr, addr1, addr2, addr3 } = await loadFixture(
        deployMultisigContract
      );
      const amount = hre.ethers.parseUnits("0", 18);

      // Expect transfer to fail if the recipient address is zero
      await expect(
        multisig.transfer(amount, hre.ethers.ZeroAddress, tokenAddr)
      ).to.revertedWith("can't send zero amount");
    });

    // Ensure transfer fails if token address is zero
    it("Should revert if token address is zero", async function () {
      const { multisig, tokenAddr, addr1, addr2, addr3 } = await loadFixture(
        deployMultisigContract
      );
      await tokenAddr.transfer(multisig, hre.ethers.parseUnits("500", 18));
      const amount = hre.ethers.parseUnits("10", 18);

      // Expect transfer to fail if the token address is zero
      await expect(
        multisig.transfer(amount, addr2.address, hre.ethers.ZeroAddress)
      ).to.revertedWith("address zero found");
    });

    // Ensure transfer fails if the multisig balance is less than the transfer amount
    it("Should revert if token address balance is less than amount", async function () {
      const { multisig, tokenAddr, addr1, addr2, addr3 } = await loadFixture(
        deployMultisigContract
      );
      await tokenAddr.transfer(multisig, hre.ethers.parseUnits("500", 18));
      const amount = hre.ethers.parseUnits("600", 18);

      // Expect transfer to fail if there are insufficient funds
      await expect(
        multisig.transfer(amount, addr2.address, tokenAddr)
      ).to.revertedWith("insufficient funds");
    });

    // Ensure transaction is submitted correctly
    it("Should check if transaction is submitted correctly", async function () {
      const { multisig, tokenAddr, addr1, addr2, addr3 } = await loadFixture(
        deployMultisigContract
      );
      await tokenAddr.transfer(multisig, hre.ethers.parseUnits("500", 18));
      const amount = hre.ethers.parseUnits("20", 18);

      // Perform the transfer
      await multisig.transfer(amount, addr1.address, tokenAddr);

      // Ensure the transaction count has increased
      expect(await multisig.txCount()).to.equal(1);
    });
  });

  // Approving transactions tests
  describe("Approve Trx", function () {
    // Ensure approval fails if an invalid transaction ID is passed
    it("Should revert if invalid trx id is passed", async function () {
      const { multisig, tokenAddr, addr1, addr2, addr3 } = await loadFixture(
        deployMultisigContract
      );

      // Expect approval to fail if the transaction ID is invalid
      await expect(multisig.approveTx(0)).to.revertedWith("invalid tx id");
    });

    // Additional tests for transaction approvals (not provided)...
    it("Should revert if token address balance is less than amount", async function () {
      const { multisig, tokenAddr, addr1, addr2, addr3 } = await loadFixture(
        deployMultisigContract
      );
      await tokenAddr.transfer(multisig, hre.ethers.parseUnits("500", 18));
      const amount = hre.ethers.parseUnits("600", 18);
      // await multisig.transfer(amount, addr1.address, tokenAddr);

      await expect(
        multisig.transfer(amount, addr1.address, tokenAddr)
      ).to.revertedWith("insufficient funds");
    });
    it("Should revert if the sender is not a valid signer", async function () {
      const { multisig, tokenAddr, addr1, addr2, addr3 } = await loadFixture(
        deployMultisigContract
      );
      expect(multisig.connect(addr3).approveTx(1)).to.revertedWith(
        "invalid signer"
      );
    });
    it("Should revert if the sender tries to sign twice", async function () {
      const { multisig, tokenAddr, addr1, addr2, addr3 } = await loadFixture(
        deployMultisigContract
      );
      await tokenAddr.transfer(multisig, hre.ethers.parseUnits("500", 18));
      const amount = hre.ethers.parseUnits("20", 18);
      await multisig.transfer(amount, addr1.address, tokenAddr);
      await expect(multisig.approveTx(1)).to.revertedWith("can't sign twice");
    });
    it("Should revert if number of approvals reached quorum", async function () {
      const { multisig, tokenAddr, addr1, addr2, addr3 } = await loadFixture(
        deployMultisigContract
      );
      await tokenAddr.transfer(multisig, hre.ethers.parseUnits("500", 18));
      const amount = hre.ethers.parseUnits("20", 18);
      await multisig.transfer(amount, addr1.address, tokenAddr);
      await multisig.connect(addr1).approveTx(1);
      await multisig.connect(addr2).approveTx(1);

      await expect(multisig.approveTx(1)).to.revertedWith(
        "approvals already reached"
      );
    });
    it("Should successfully complete the transaction if number of approvals reached quorum and transaction is not completed before", async function () {
      const { multisig, tokenAddr, addr1, addr2, addr3 } = await loadFixture(
        deployMultisigContract
      );
      await tokenAddr.transfer(multisig, hre.ethers.parseUnits("500", 18));
      const amount = hre.ethers.parseUnits("20", 18);
      await multisig.transfer(amount, addr1.address, tokenAddr);
      await multisig.connect(addr1).approveTx(1);
      await multisig.connect(addr2).approveTx(1);
      expect(await tokenAddr.balanceOf(addr1.address)).to.be.equal(amount);
    });
  });

  describe("updateQuorum", function () {
    it("Should revert if sender is not a valid signer", async function () {
      const { multisig, tokenAddr, addr1, addr2, addr3 } = await loadFixture(
        deployMultisigContract
      );
      await tokenAddr.transfer(multisig, hre.ethers.parseUnits("500", 18));
      const amount = hre.ethers.parseUnits("20", 18);
      await multisig.transfer(amount, addr1.address, tokenAddr);

      await expect(multisig.connect(addr3).approveTx(1)).to.revertedWith(
        "not a valid signer"
      );
    });
    it("Should revert if new quorum is greater than no of valid signers", async function () {
      const { multisig, tokenAddr, addr1, addr2, addr3 } = await loadFixture(
        deployMultisigContract
      );

      await expect(multisig.updateQuorum(4)).to.revertedWith(
        "quorum greater than valid signers"
      );
    });
    it("Should revert if new quorum is not greater than 1", async function () {
      const { multisig, tokenAddr, addr1, addr2, addr3 } = await loadFixture(
        deployMultisigContract
      );

      await expect(multisig.updateQuorum(1)).to.revertedWith(
        "quorum is too small"
      );
    });

    it("Should ensure that quorum update tx is submitted successfully", async function () {
      const { multisig, tokenAddr, addr1, addr2, addr3 } = await loadFixture(
        deployMultisigContract
      );
      await multisig.updateQuorum(2);

      expect(await multisig.quorumUpdateCount()).to.be.equal(1);
    });
  });

  describe("Approve QuorumUpdate Trx", function () {
    it("Should revert if invalid trx id is passed", async function () {
      const { multisig, tokenAddr, addr1, addr2, addr3 } = await loadFixture(
        deployMultisigContract
      );

      await multisig.updateQuorum(2);
      await expect(multisig.approveQuorumUpdate(0)).to.be.revertedWith(
        "invalid tx id"
      );
    });

    it("Should revert if the sender is not a valid signer", async function () {
      const { multisig, tokenAddr, addr1, addr2, addr3 } = await loadFixture(
        deployMultisigContract
      );
      await multisig.updateQuorum(2);
      expect(multisig.connect(addr3).approveQuorumUpdate(1)).to.revertedWith(
        "not a valid signer"
      );
    });
    it("Should revert if the sender tries to sign twice", async function () {
      const { multisig, tokenAddr, addr1, addr2, addr3 } = await loadFixture(
        deployMultisigContract
      );

      await multisig.updateQuorum(2);
      await expect(multisig.approveQuorumUpdate(1)).to.be.revertedWith(
        "can't sign twice"
      );
    });

    it("Should revert if attempt to sign after transaction is completed", async function () {
      const { multisig, tokenAddr, addr1, addr2, addr3 } = await loadFixture(
        deployMultisigContract
      );
      await multisig.updateQuorum(2);
      await multisig.connect(addr1).approveQuorumUpdate(1);
      await multisig.connect(addr2).approveQuorumUpdate(1);

      await expect(multisig.approveQuorumUpdate(1)).to.revertedWith(
        "transaction already completed"
      );
    });

    it("Should successfully complete the quorum update if number of approvals reached quorum ", async function () {
      const { multisig, tokenAddr, addr1, addr2, addr3 } = await loadFixture(
        deployMultisigContract
      );
      await multisig.updateQuorum(2);
      await multisig.connect(addr1).approveQuorumUpdate(1);
      await multisig.connect(addr2).approveQuorumUpdate(1);
      expect(await multisig.quorum()).to.be.equal(2);
    });
  });
});
