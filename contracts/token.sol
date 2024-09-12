// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Importing the ERC20 contract from OpenZeppelin library
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Custom error definition for unauthorized access
error NotOwner();

/**
 * @title LayintonToken
 * @dev ERC20 token contract with minting functionality restricted to the owner.
 */
contract MLToken is ERC20 {
    // The owner of the contract, set as immutable after deployment
    address private immutable owner;

    // Event emitted when tokens are successfully minted
    event MintSuccessful(address indexed _to, uint _amount, uint _timestamp);

    /**
     * @dev Constructor to set the initial supply and the owner of the contract.
     * Mints an initial supply of 500,000 LAYI tokens to the owner's address.
     */
    constructor() ERC20("MLToken", "MLT") {
        // Set the owner to the address that deploys the contract
        owner = msg.sender;

        // Mint an initial supply of 500,000 LAYI tokens to the owner
        _mint(msg.sender, 500000e18);
    }

    /**
     * @dev Allows the owner to mint new tokens.
     * @param _amount The amount of tokens to mint (in whole units, without decimals).
     */
    function mint(uint _amount) external {
        // Ensure that only the owner can call this function
        if (msg.sender != owner) {
            revert NotOwner();
        }

        // Mint the specified amount of tokens to the owner's address
        _mint(msg.sender, _amount * 1e18);

        // Emit an event to signal a successful minting operation
        emit MintSuccessful(msg.sender, _amount, block.timestamp);
    }
}