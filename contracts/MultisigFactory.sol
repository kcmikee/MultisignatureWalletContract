// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./Multisig.sol";

contract MultisigFactory {
    address[] public newArr;
    Multisig[] multisigClones;

    function createMultisigWallet(
        uint256 _quorum,
        address[] memory _validSigners
    ) external returns (Multisig newMulsig_, uint256 length_) {
        // for (uint256 index = 0; index < _validSigners.length; index++) {
        //     newArr.push(_validSigners[index]);
        // }
        newArr = _validSigners;
        newArr.push(msg.sender);
        newMulsig_ = new Multisig(_quorum, newArr);

        multisigClones.push(newMulsig_);

        length_ = multisigClones.length;
    }

    function getMultiSigClones() external view returns (Multisig[] memory) {
        return multisigClones;
    }
}
