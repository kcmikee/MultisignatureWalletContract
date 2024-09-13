// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;
import "../Multisig.sol";

interface IMultisigFactory{
    function createMultisigWallet(uint256 _quorum, address[] memory _validSigners) external returns (Multisig newMulsig_, uint256 length_);
    function getMultiSigClones() external view returns(Multisig[] memory);
}