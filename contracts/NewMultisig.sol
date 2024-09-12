// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24; // Define the Solidity version

// Import the IERC20 interface to interact with ERC20 tokens
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Contract definition
contract NewMultisig {

    error NotOwner();
    // State variables
    uint8 public quorum; // The number of approvals required for a transaction to be executed
    uint8 public noOfValidSigners; // Total number of valid signers
    uint256 public txCount; // Counter for transactions
    uint256 public quorumUpdateCount; // Counter for quorum update requests

    // Struct to manage quorum updates
    struct QuorumUpdate {
        uint256 id; // Unique identifier for quorum update
        address sender; // The address of the user who initiated the quorum update
        address[] transactionSigners; // List of signers who approved this quorum update
        bool isCompleted; // Status flag indicating if the quorum update is complete
        uint256 timestamp; // Timestamp of the quorum update creation
        uint256 noOfApproval; // Number of approvals for this quorum update
        uint8 prevQuorumNumber; // Previous quorum number
        uint8 newQuorumNumber; // The new quorum number
    }

    // Struct to manage transactions
    struct Transaction {
        uint256 id; // Unique identifier for the transaction
        uint256 amount; // Amount of tokens to transfer
        address sender; // Address of the user who initiated the transaction
        address recipient; // Address of the recipient
        bool isCompleted; // Status flag indicating if the transaction is completed
        uint256 timestamp; // Timestamp when the transaction was created
        uint256 noOfApproval; // Number of approvals for this transaction
        address tokenAddress; // Address of the ERC20 token contract
        address[] transactionSigners; // List of signers who approved the transaction
    }

    // Mapping to check if an address is a valid signer
    mapping(address => bool) isValidSigner;

    // Mapping from quorum update ID to QuorumUpdate struct
    mapping(uint => QuorumUpdate) quorumUpdates;

    // Mapping from transaction ID to Transaction struct
    mapping(uint => Transaction) transactions;

    // Mapping to track if a signer has signed a particular transaction
    mapping(address => mapping(uint256 => bool)) hasSigned;

    // Mapping to track if a signer has signed a particular quorum update
    mapping(address => mapping(uint256 => bool)) hasSignedQuorumTrx;

    // Constructor to initialize the contract with a quorum and valid signers
    constructor(uint8 _quorum, address[] memory _validSigners) {
        require(_validSigners.length > 1, "few valid signers"); // Ensure there are multiple valid signers
        require(_quorum > 1, "quorum is too small"); // Ensure quorum is greater than 1

        // Loop through the provided valid signers and add them to the isValidSigner mapping
        for (uint256 i = 0; i < _validSigners.length; i++) {
            require(_validSigners[i] != address(0), "zero address not allowed"); // Ensure no zero address is used
            require(!isValidSigner[_validSigners[i]], "signer already exist"); // Ensure no duplicate signers

            isValidSigner[_validSigners[i]] = true; // Mark the address as a valid signer
        }

        noOfValidSigners = uint8(_validSigners.length); // Store the number of valid signers

        // If the sender is not already a valid signer, add them as a signer
        if (!isValidSigner[msg.sender]) {
            isValidSigner[msg.sender] = true;
            noOfValidSigners += 1;
        }

        // Ensure the quorum is less than or equal to the number of valid signers
        require(
            _quorum <= noOfValidSigners,
            "quorum greater than valid signers"
        );
        quorum = _quorum; // Set the initial quorum value
    }

    // Function to initiate a token transfer, requiring multisig approval
    function transfer(
        uint256 _amount, // Amount of tokens to transfer
        address _recipient, // Recipient's address
        address _tokenAddress // ERC20 token contract address
    ) external {
        require(msg.sender != address(0), "address zero found"); // Prevent zero address for the sender
        require(isValidSigner[msg.sender], "invalid signer"); // Ensure the sender is a valid signer

        require(_amount > 0, "can't send zero amount"); // Prevent sending 0 tokens
        require(_recipient != address(0), "address zero found"); // Prevent zero address for the recipient
        require(_tokenAddress != address(0), "address zero found"); // Prevent zero address for the token contract

        // Check if the contract has enough tokens to execute the transfer
        require(
            IERC20(_tokenAddress).balanceOf(address(this)) >= _amount,
            "insufficient funds"
        );

        uint256 _txId = txCount + 1; // Generate a new transaction ID
        Transaction storage trx = transactions[_txId]; // Create a new transaction struct
        trx.id = _txId; // Assign the transaction ID
        trx.amount = _amount; // Set the transfer amount
        trx.recipient = _recipient; // Set the recipient
        trx.sender = msg.sender; // Set the sender
        trx.timestamp = block.timestamp; // Record the timestamp
        trx.tokenAddress = _tokenAddress; // Set the token contract address
        trx.noOfApproval += 1; // Increase the approval count
        trx.transactionSigners.push(msg.sender); // Add the sender as a signer
        hasSigned[msg.sender][_txId] = true; // Mark the sender as having signed this transaction

        txCount += 1; // Increment the transaction count
    }

    // Function to approve a pending transaction
    function approveTx(uint8 _txId) external {
        Transaction storage trx = transactions[_txId]; // Get the transaction details

        require(trx.id != 0, "invalid tx id"); // Ensure the transaction exists
        require(
            IERC20(trx.tokenAddress).balanceOf(address(this)) >= trx.amount,
            "insufficient funds"
        ); // Ensure the contract has enough tokens
        require(trx.noOfApproval < quorum, "approvals already reached"); // Ensure the transaction has not already reached the required approvals
        require(!trx.isCompleted, "transaction already completed"); // Ensure the transaction is not already completed

        require(isValidSigner[msg.sender], "not a valid signer"); // Ensure the sender is a valid signer
        require(!hasSigned[msg.sender][_txId], "can't sign twice"); // Prevent the signer from signing the same transaction twice

        hasSigned[msg.sender][_txId] = true; // Mark the sender as having signed the transaction
        trx.noOfApproval += 1; // Increase the approval count
        trx.transactionSigners.push(msg.sender); // Add the sender to the list of signers

        // If the required number of approvals is reached, complete the transaction
        if (trx.noOfApproval == quorum) {
            trx.isCompleted = true; // Mark the transaction as completed
            IERC20(trx.tokenAddress).transfer(trx.recipient, trx.amount); // Transfer the tokens to the recipient
        }
    }

    // Function to initiate a quorum update request
    function updateQuorum(uint8 _quorum) external {
        require(isValidSigner[msg.sender], "not a valid signer"); // Ensure the sender is a valid signer
        require(msg.sender != address(0), "zero address not allowed"); // Prevent zero address for the sender
        require(
            _quorum <= noOfValidSigners,
            "quorum greater than valid signers"
        ); // Ensure the new quorum is valid
        require(_quorum > 1, "quorum is too small"); // Ensure the new quorum is greater than 1

        uint256 _txId = quorumUpdateCount + 1; // Generate a new quorum update ID
        QuorumUpdate storage trx = quorumUpdates[_txId]; // Create a new quorum update struct
        trx.id = _txId; // Assign the quorum update ID
        trx.sender = msg.sender; // Set the sender of the quorum update
        trx.timestamp = block.timestamp; // Record the timestamp
        trx.noOfApproval += 1; // Increase the approval count
        trx.transactionSigners.push(msg.sender); // Add the sender to the list of signers
        hasSignedQuorumTrx[msg.sender][_txId] = true; // Mark the sender as having signed this quorum update
        quorumUpdateCount += 1; // Increment the quorum update count
        trx.prevQuorumNumber = quorum; // Store the previous quorum value
        trx.newQuorumNumber = _quorum; // Set the new quorum value
    }

    // Function to approve a quorum update request
    function approveQuorumUpdate(uint8 _txId) external {
        QuorumUpdate storage trx = quorumUpdates[_txId]; // Get the quorum update details

        require(trx.id != 0, "invalid tx id"); // Ensure the quorum update exists
        require(!trx.isCompleted, "transaction already completed"); // Ensure the quorum update is not already completed
        require(trx.noOfApproval < quorum, "approvals already reached"); // Ensure the required approvals have not already been reached

        require(isValidSigner[msg.sender], "not a valid signer"); // Ensure the sender is a valid signer
        require(!hasSignedQuorumTrx[msg.sender][_txId], "can't sign twice"); // Prevent the signer from signing the same quorum update twice

        hasSignedQuorumTrx[msg.sender][_txId] = true; // Mark the sender as having signed the quorum update
        trx.noOfApproval += 1; // Increase the approval count
        trx.transactionSigners.push(msg.sender); // Add the sender to the list of signers

        // If the required number of approvals is reached, complete the quorum update
        if (trx.noOfApproval == quorum) {
            trx.isCompleted = true; // Mark the quorum update as completed
            quorum = trx.newQuorumNumber; // Update the quorum value
        }
    }

    // Function to check if a given address is a valid signer
    function getAVlaidSigner(address addr) external view returns (bool) {
        return isValidSigner[addr];
    }
}