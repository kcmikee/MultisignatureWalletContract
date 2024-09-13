// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

interface IMultisig{
    function transfer(uint256 _amount, address _recipient, address _tokenAddress) external;
    function approveTx(uint8 _txId) external;
    function proposeQuorum(uint256 _newQuorum) external;
    function approveQuorum() external;
}