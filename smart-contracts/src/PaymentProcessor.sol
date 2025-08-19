// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title PaymentProcessor
 * @notice Accepts payments in approved stablecoins and holds them in escrow until frontend confirmation.
 * @dev Amounts are in the token's smallest units (respect token decimals).
 */
contract PaymentProcessor is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice Address that receives all successful payments
    address public paymentReceiver;

    /// @notice Mapping of token address => is supported
    mapping(address => bool) public isSupportedToken;

    /// @notice List of supported tokens for enumeration
    address[] private _supportedTokens;

    /// @notice Escrow timeout duration (default: 24 hours)
    uint256 public escrowTimeout = 24 hours;

    /// @notice Counter for generating unique payment IDs
    uint256 private _paymentIdCounter;

    /// @notice Struct to hold escrow details
    struct EscrowPayment {
        address token;
        address sender;
        uint256 amount;
        uint256 createdAt;
        bool isActive;
    }

    /// @notice Mapping of payment ID => escrow payment details
    mapping(uint256 => EscrowPayment) public escrowPayments;

    /* ========== EVENTS ========== */

    event PaymentInitiated(
        uint256 indexed paymentId,
        address indexed token,
        address indexed sender,
        uint256 amount,
        uint256 timestamp
    );

    event PaymentCompleted(
        uint256 indexed paymentId,
        address indexed token,
        address indexed sender,
        uint256 amount,
        uint256 timestamp
    );

    event PaymentRefunded(
        uint256 indexed paymentId,
        address indexed token,
        address indexed sender,
        uint256 amount,
        uint256 timestamp
    );

    event PaymentReceiverUpdated(
        address indexed oldReceiver,
        address indexed newReceiver
    );

    event TokenSupportUpdated(
        address indexed token,
        bool supported,
        uint256 timestamp
    );

    event EscrowTimeoutUpdated(
        uint256 oldTimeout,
        uint256 newTimeout
    );

    /* ========== ERRORS ========== */

    error InvalidAddress();
    error TokenNotSupported();
    error PaymentNotFound();
    error PaymentNotActive();
    error PaymentNotExpired();
    error UnauthorizedCaller();

    /* ========== CONSTRUCTOR ========== */

    /**
     * @param _paymentReceiver Address that will receive successful payments
     * @param initialTokens Array of token addresses to whitelist at deploy time
     * @param owner_ Owner address for admin controls
     */
    constructor(
        address _paymentReceiver,
        address[] memory initialTokens,
        address owner_
    ) {
        if (_paymentReceiver == address(0) || owner_ == address(0)) {
            revert InvalidAddress();
        }

        paymentReceiver = _paymentReceiver;
        _transferOwnership(owner_);

        // Initialize supported tokens
        for (uint256 i = 0; i < initialTokens.length; i++) {
            _addSupportedToken(initialTokens[i]);
        }
    }

    /* ========== MODIFIERS ========== */

    modifier onlySupported(address token) {
        if (!isSupportedToken[token]) revert TokenNotSupported();
        _;
    }

    modifier paymentExists(uint256 paymentId) {
        if (escrowPayments[paymentId].sender == address(0)) revert PaymentNotFound();
        _;
    }

    modifier paymentActive(uint256 paymentId) {
        if (!escrowPayments[paymentId].isActive) revert PaymentNotActive();
        _;
    }

    /* ========== USER FUNCTIONS ========== */

    /**
     * @notice Initiate a payment in one of the approved tokens. Funds are held in escrow.
     * @param token Address of the ERC20 token to use (must be approved)
     * @param amount Amount to transfer (in token's smallest units)
     * @return paymentId Unique identifier for this payment
     */
    function initiatePayment(address token, uint256 amount)
        external
        nonReentrant
        onlySupported(token)
        returns (uint256 paymentId)
    {
        require(amount > 0, "Amount must be > 0");

        paymentId = ++_paymentIdCounter;

        // Store escrow details
        escrowPayments[paymentId] = EscrowPayment({
            token: token,
            sender: msg.sender,
            amount: amount,
            createdAt: block.timestamp,
            isActive: true
        });

        // Pull funds from sender to this contract (escrow)
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        emit PaymentInitiated(paymentId, token, msg.sender, amount, block.timestamp);
    }

    /**
     * @notice Complete a payment by transferring funds to the receiver.
     * @dev Can only be called by the contract owner (representing frontend confirmation)
     * @param paymentId The unique payment identifier
     */
    function completePayment(uint256 paymentId)
        external
        onlyOwner
        nonReentrant
        paymentExists(paymentId)
        paymentActive(paymentId)
    {
        EscrowPayment storage payment = escrowPayments[paymentId];
        
        // Mark as inactive
        payment.isActive = false;

        // Transfer funds to receiver
        IERC20(payment.token).safeTransfer(paymentReceiver, payment.amount);

        emit PaymentCompleted(paymentId, payment.token, payment.sender, payment.amount, block.timestamp);
    }

    /**
     * @notice Refund a payment by returning funds to the sender.
     * @dev Can only be called by the contract owner (representing frontend failure confirmation)
     * @param paymentId The unique payment identifier
     */
    function refundPayment(uint256 paymentId)
        external
        onlyOwner
        nonReentrant
        paymentExists(paymentId)
        paymentActive(paymentId)
    {
        EscrowPayment storage payment = escrowPayments[paymentId];
        
        // Mark as inactive
        payment.isActive = false;

        // Return funds to sender
        IERC20(payment.token).safeTransfer(payment.sender, payment.amount);

        emit PaymentRefunded(paymentId, payment.token, payment.sender, payment.amount, block.timestamp);
    }

    /**
     * @notice Allow sender to reclaim funds if escrow has expired without resolution.
     * @param paymentId The unique payment identifier
     */
    function reclaimExpiredPayment(uint256 paymentId)
        external
        nonReentrant
        paymentExists(paymentId)
        paymentActive(paymentId)
    {
        EscrowPayment storage payment = escrowPayments[paymentId];
        
        // Only the original sender can reclaim
        if (msg.sender != payment.sender) revert UnauthorizedCaller();
        
        // Check if payment has expired
        if (block.timestamp < payment.createdAt + escrowTimeout) revert PaymentNotExpired();

        // Mark as inactive
        payment.isActive = false;

        // Return funds to sender
        IERC20(payment.token).safeTransfer(payment.sender, payment.amount);

        emit PaymentRefunded(paymentId, payment.token, payment.sender, payment.amount, block.timestamp);
    }

    /* ========== OWNER FUNCTIONS ========== */

    /**
     * @notice Update the address that receives payments.
     */
    function updatePaymentReceiver(address newReceiver) external onlyOwner {
        if (newReceiver == address(0)) revert InvalidAddress();
        address old = paymentReceiver;
        paymentReceiver = newReceiver;
        emit PaymentReceiverUpdated(old, newReceiver);
    }

    /**
     * @notice Update the escrow timeout duration.
     */
    function updateEscrowTimeout(uint256 newTimeout) external onlyOwner {
        uint256 old = escrowTimeout;
        escrowTimeout = newTimeout;
        emit EscrowTimeoutUpdated(old, newTimeout);
    }

    /**
     * @notice Add a token to the supported list.
     */
    function addSupportedToken(address token) external onlyOwner {
        _addSupportedToken(token);
    }

    /**
     * @notice Remove a token from the supported list.
     */
    function removeSupportedToken(address token) external onlyOwner {
        if (token == address(0)) revert InvalidAddress();
        if (isSupportedToken[token]) {
            isSupportedToken[token] = false;
            emit TokenSupportUpdated(token, false, block.timestamp);

            // remove from array (swap & pop)
            for (uint256 i = 0; i < _supportedTokens.length; i++) {
                if (_supportedTokens[i] == token) {
                    _supportedTokens[i] = _supportedTokens[_supportedTokens.length - 1];
                    _supportedTokens.pop();
                    break;
                }
            }
        }
    }

    /* ========== VIEWS ========== */

    /**
     * @notice Returns the full list of currently supported tokens.
     */
    function supportedTokens() external view returns (address[] memory) {
        return _supportedTokens;
    }

    /**
     * @notice Get payment details by ID.
     */
    function getPaymentDetails(uint256 paymentId)
        external
        view
        returns (
            address token,
            address sender,
            uint256 amount,
            uint256 createdAt,
            bool isActive
        )
    {
        EscrowPayment memory payment = escrowPayments[paymentId];
        return (
            payment.token,
            payment.sender,
            payment.amount,
            payment.createdAt,
            payment.isActive
        );
    }

    /**
     * @notice Check if a payment has expired.
     */
    function isPaymentExpired(uint256 paymentId) external view returns (bool) {
        EscrowPayment memory payment = escrowPayments[paymentId];
        if (payment.sender == address(0) || !payment.isActive) return false;
        return block.timestamp >= payment.createdAt + escrowTimeout;
    }

    /**
     * @notice Get the current payment ID counter.
     */
    function getCurrentPaymentId() external view returns (uint256) {
        return _paymentIdCounter;
    }

    /* ========== INTERNALS ========== */

    function _addSupportedToken(address token) internal {
        if (token == address(0)) revert InvalidAddress();
        if (!isSupportedToken[token]) {
            isSupportedToken[token] = true;
            _supportedTokens.push(token);
            emit TokenSupportUpdated(token, true, block.timestamp);
        }
    }
}