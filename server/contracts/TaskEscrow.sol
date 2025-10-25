// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol"; // ✅ Changed
import "@openzeppelin/contracts/utils/Pausable.sol"; // ✅ Changed

/**
 * @title TaskEscrow
 * @dev Escrow contract for AI-powered micro-task marketplace on Celo
 * @notice Holds task payments in escrow and releases after AI verification
 */
contract TaskEscrow is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============ State Variables ============

    /// @notice cUSD token address on Celo
    IERC20 public immutable cUSD;

    /// @notice Platform fee percentage (5% = 500 basis points)
    uint256 public constant PLATFORM_FEE_BPS = 500;
    uint256 public constant BPS_DENOMINATOR = 10000;

    /// @notice Accumulated platform fees
    uint256 public platformFeesAccumulated;

    /// @notice Task counter for unique IDs
    uint256 public taskCounter;

    // ============ Enums ============

    enum TaskStatus {
        Open,
        InProgress,
        Completed,
        Cancelled,
        Expired
    }

    // ============ Structs ============

    struct Task {
        uint256 taskId;
        address requester;
        address worker;
        uint256 paymentAmount;
        TaskStatus status;
        uint256 createdAt;
        uint256 expiresAt;
    }

    // ============ Mappings ============

    /// @notice Mapping from taskId to Task struct
    mapping(uint256 => Task) public tasks;

    /// @notice Mapping from taskId to whether it exists
    mapping(uint256 => bool) public taskExists;

    // ============ Events ============

    event TaskCreated(
        uint256 indexed taskId,
        address indexed requester,
        uint256 paymentAmount,
        uint256 expiresAt
    );

    event WorkerAssigned(uint256 indexed taskId, address indexed worker);

    event PaymentReleased(
        uint256 indexed taskId,
        address indexed worker,
        uint256 workerAmount,
        uint256 platformFee
    );

    event TaskCancelled(
        uint256 indexed taskId,
        address indexed requester,
        uint256 refundAmount
    );

    event TaskExpired(
        uint256 indexed taskId,
        address indexed requester,
        uint256 refundAmount
    );

    event PlatformFeesWithdrawn(address indexed owner, uint256 amount);

    // ============ Modifiers ============

    modifier onlyRequester(uint256 _taskId) {
        require(tasks[_taskId].requester == msg.sender, "Not task requester");
        _;
    }

    modifier taskIsOpen(uint256 _taskId) {
        require(tasks[_taskId].status == TaskStatus.Open, "Task not open");
        _;
    }

    modifier taskInProgress(uint256 _taskId) {
        require(
            tasks[_taskId].status == TaskStatus.InProgress,
            "Task not in progress"
        );
        _;
    }

    modifier validTask(uint256 _taskId) {
        require(taskExists[_taskId], "Task does not exist");
        _;
    }

    modifier notExpired(uint256 _taskId) {
        require(block.timestamp < tasks[_taskId].expiresAt, "Task expired");
        _;
    }

    // ============ Constructor ============

    /**
     * @dev Constructor to initialize the contract
     * @param _cUSDAddress Address of cUSD token on Celo
     */
    constructor(address _cUSDAddress) Ownable(msg.sender) {
        // ✅ Add Ownable(msg.sender)
        require(_cUSDAddress != address(0), "Invalid cUSD address");
        cUSD = IERC20(_cUSDAddress);
    }

    // ============ Main Functions ============

    /**
     * @notice Create a new task and lock payment in escrow
     * @param _paymentAmount Amount of cUSD to pay worker
     * @param _durationInDays Task duration in days before expiry
     * @return taskId The ID of the created task
     */
    function createTask(
        uint256 _paymentAmount,
        uint256 _durationInDays
    ) external whenNotPaused nonReentrant returns (uint256) {
        require(_paymentAmount > 0, "Payment must be > 0");
        require(
            _durationInDays > 0 && _durationInDays <= 90,
            "Invalid duration"
        );

        taskCounter++;
        uint256 newTaskId = taskCounter;

        // Calculate expiry timestamp
        uint256 expiresAt = block.timestamp + (_durationInDays * 1 days);

        // Transfer cUSD from requester to contract
        cUSD.safeTransferFrom(msg.sender, address(this), _paymentAmount);

        // Create task
        tasks[newTaskId] = Task({
            taskId: newTaskId,
            requester: msg.sender,
            worker: address(0),
            paymentAmount: _paymentAmount,
            status: TaskStatus.Open,
            createdAt: block.timestamp,
            expiresAt: expiresAt
        });

        taskExists[newTaskId] = true;

        emit TaskCreated(newTaskId, msg.sender, _paymentAmount, expiresAt);

        return newTaskId;
    }

    /**
     * @notice Assign a worker to a task
     * @param _taskId Task ID to assign worker to
     * @param _worker Address of the worker
     */
    function assignWorker(
        uint256 _taskId,
        address _worker
    )
        external
        validTask(_taskId)
        taskIsOpen(_taskId)
        notExpired(_taskId)
        onlyRequester(_taskId)
    {
        require(_worker != address(0), "Invalid worker address");
        require(
            _worker != tasks[_taskId].requester,
            "Requester cannot be worker"
        );

        tasks[_taskId].worker = _worker;
        tasks[_taskId].status = TaskStatus.InProgress;

        emit WorkerAssigned(_taskId, _worker);
    }

    /**
     * @notice Approve submission and release payment (called by backend after AI verification)
     * @param _taskId Task ID to approve
     */
    function approveSubmission(
        uint256 _taskId
    )
        external
        validTask(_taskId)
        taskInProgress(_taskId)
        onlyOwner
        nonReentrant
    {
        Task storage task = tasks[_taskId];
        require(task.worker != address(0), "No worker assigned");

        uint256 totalAmount = task.paymentAmount;

        // Calculate platform fee (5%)
        uint256 platformFee = (totalAmount * PLATFORM_FEE_BPS) /
            BPS_DENOMINATOR;
        uint256 workerAmount = totalAmount - platformFee;

        // Update state before transfers
        task.status = TaskStatus.Completed;
        platformFeesAccumulated += platformFee;

        // Transfer payment to worker
        cUSD.safeTransfer(task.worker, workerAmount);

        emit PaymentReleased(_taskId, task.worker, workerAmount, platformFee);
    }

    /**
     * @notice Reject submission and refund requester
     * @param _taskId Task ID to reject
     */
    function rejectSubmission(
        uint256 _taskId
    )
        external
        validTask(_taskId)
        taskInProgress(_taskId)
        onlyOwner
        nonReentrant
    {
        Task storage task = tasks[_taskId];

        uint256 refundAmount = task.paymentAmount;
        task.status = TaskStatus.Cancelled;

        // Refund requester
        cUSD.safeTransfer(task.requester, refundAmount);

        emit TaskCancelled(_taskId, task.requester, refundAmount);
    }

    /**
     * @notice Cancel open task and refund requester
     * @param _taskId Task ID to cancel
     */
    function cancelTask(
        uint256 _taskId
    )
        external
        validTask(_taskId)
        taskIsOpen(_taskId)
        onlyRequester(_taskId)
        nonReentrant
    {
        Task storage task = tasks[_taskId];

        uint256 refundAmount = task.paymentAmount;
        task.status = TaskStatus.Cancelled;

        // Refund requester
        cUSD.safeTransfer(task.requester, refundAmount);

        emit TaskCancelled(_taskId, task.requester, refundAmount);
    }

    /**
     * @notice Claim refund for expired task
     * @param _taskId Task ID that expired
     */
    function claimExpiredTask(
        uint256 _taskId
    ) external validTask(_taskId) nonReentrant {
        Task storage task = tasks[_taskId];
        require(block.timestamp >= task.expiresAt, "Task not expired yet");
        require(
            task.status == TaskStatus.Open ||
                task.status == TaskStatus.InProgress,
            "Task already finalized"
        );
        require(msg.sender == task.requester, "Only requester can claim");

        uint256 refundAmount = task.paymentAmount;
        task.status = TaskStatus.Expired;

        // Refund requester
        cUSD.safeTransfer(task.requester, refundAmount);

        emit TaskExpired(_taskId, task.requester, refundAmount);
    }

    /**
     * @notice Withdraw accumulated platform fees
     */
    function withdrawPlatformFees() external onlyOwner nonReentrant {
        uint256 amount = platformFeesAccumulated;
        require(amount > 0, "No fees to withdraw");

        platformFeesAccumulated = 0;

        cUSD.safeTransfer(owner(), amount);

        emit PlatformFeesWithdrawn(owner(), amount);
    }

    // ============ View Functions ============

    /**
     * @notice Get task details
     * @param _taskId Task ID to query
     * @return Task struct
     */
    function getTask(
        uint256 _taskId
    ) external view validTask(_taskId) returns (Task memory) {
        return tasks[_taskId];
    }

    /**
     * @notice Check if task is expired
     * @param _taskId Task ID to check
     * @return bool True if expired
     */
    function isTaskExpired(
        uint256 _taskId
    ) external view validTask(_taskId) returns (bool) {
        return block.timestamp >= tasks[_taskId].expiresAt;
    }

    /**
     * @notice Get contract balance of cUSD
     * @return uint256 Balance
     */
    function getContractBalance() external view returns (uint256) {
        return cUSD.balanceOf(address(this));
    }

    // ============ Admin Functions ============

    /**
     * @notice Pause contract in case of emergency
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
