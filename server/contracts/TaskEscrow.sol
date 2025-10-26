// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title TaskEscrow
 * @dev Escrow smart contract for AI-powered micro-task marketplace on CELO Sepolia Testnet.
 * @notice This contract securely holds cUSD payments for tasks, releasing to workers upon AI-verification approval.
 */
contract TaskEscrow is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============ Constants & Parameters ============
    IERC20 public immutable cUSD;

    uint256 public constant PLATFORM_FEE_BPS = 500; // 5%
    uint256 public constant BPS_DENOMINATOR = 10000;

    uint256 public platformFeesAccumulated;
    uint256 public taskCounter;

    // ============ Enums ============
    enum TaskStatus {
        Open,
        InProgress,
        Completed,
        Cancelled,
        Expired
    }

    // ============ Struct ============
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
    mapping(uint256 => Task) public tasks;
    mapping(uint256 => bool) public taskExists;

    // ============ Events ============
    event TaskCreated(
        uint256 indexed taskId,
        address indexed requester,
        uint256 payment,
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
        uint256 refunded
    );
    event TaskExpired(
        uint256 indexed taskId,
        address indexed requester,
        uint256 refunded
    );
    event PlatformFeesWithdrawn(address indexed owner, uint256 amount);
    event DebugLog(
        string action,
        address sender,
        uint256 taskId,
        uint256 timestamp
    );

    // ============ Modifiers ============
    modifier validTask(uint256 _taskId) {
        require(taskExists[_taskId], "Invalid task ID");
        _;
    }

    modifier onlyRequester(uint256 _taskId) {
        require(tasks[_taskId].requester == msg.sender, "Not requester");
        _;
    }

    modifier taskIsOpen(uint256 _taskId) {
        require(tasks[_taskId].status == TaskStatus.Open, "Not open");
        _;
    }

    modifier taskInProgress(uint256 _taskId) {
        require(
            tasks[_taskId].status == TaskStatus.InProgress,
            "Not in progress"
        );
        _;
    }

    // ============ Constructor ============
    /**
     * @param _cUSDAddress Valid cUSD contract address on Celo Sepolia.
     */
    constructor(address _cUSDAddress) Ownable(msg.sender) {
        require(_cUSDAddress != address(0), "Invalid cUSD address");
        cUSD = IERC20(_cUSDAddress);
    }

    // ============ Core Logic ============

    function createTask(
        uint256 _paymentAmount,
        uint256 _durationInDays
    ) external whenNotPaused nonReentrant returns (uint256) {
        require(_paymentAmount > 0, "Invalid amount");
        require(
            _durationInDays > 0 && _durationInDays <= 90,
            "Invalid duration"
        );

        taskCounter++;
        uint256 newTaskId = taskCounter;
        uint256 expiry = block.timestamp + (_durationInDays * 1 days);

        cUSD.safeTransferFrom(msg.sender, address(this), _paymentAmount);

        tasks[newTaskId] = Task({
            taskId: newTaskId,
            requester: msg.sender,
            worker: address(0),
            paymentAmount: _paymentAmount,
            status: TaskStatus.Open,
            createdAt: block.timestamp,
            expiresAt: expiry
        });

        taskExists[newTaskId] = true;

        emit TaskCreated(newTaskId, msg.sender, _paymentAmount, expiry);
        emit DebugLog("createTask", msg.sender, newTaskId, block.timestamp);

        return newTaskId;
    }

    function assignWorker(
        uint256 _taskId,
        address _worker
    ) external validTask(_taskId) taskIsOpen(_taskId) whenNotPaused {
        Task storage task = tasks[_taskId];
        require(
            msg.sender == task.requester || msg.sender == owner(),
            "Not authorized"
        );
        require(_worker != address(0), "Invalid worker");
        require(_worker != task.requester, "Requester cannot be worker");

        task.worker = _worker;
        task.status = TaskStatus.InProgress;

        emit WorkerAssigned(_taskId, _worker);
        emit DebugLog("assignWorker", msg.sender, _taskId, block.timestamp);
    }

    function approveSubmission(
        uint256 _taskId
    )
        external
        onlyOwner
        validTask(_taskId)
        taskInProgress(_taskId)
        nonReentrant
    {
        Task storage task = tasks[_taskId];
        uint256 total = task.paymentAmount;
        uint256 platformFee = (total * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
        uint256 workerShare = total - platformFee;

        task.status = TaskStatus.Completed;
        platformFeesAccumulated += platformFee;
        cUSD.safeTransfer(task.worker, workerShare);

        emit PaymentReleased(_taskId, task.worker, workerShare, platformFee);
        emit DebugLog(
            "approveSubmission",
            msg.sender,
            _taskId,
            block.timestamp
        );
    }

    function rejectSubmission(
        uint256 _taskId
    )
        external
        onlyOwner
        validTask(_taskId)
        taskInProgress(_taskId)
        nonReentrant
    {
        Task storage task = tasks[_taskId];
        task.status = TaskStatus.Cancelled;

        cUSD.safeTransfer(task.requester, task.paymentAmount);

        emit TaskCancelled(_taskId, task.requester, task.paymentAmount);
        emit DebugLog("rejectSubmission", msg.sender, _taskId, block.timestamp);
    }

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
        task.status = TaskStatus.Cancelled;

        cUSD.safeTransfer(task.requester, task.paymentAmount);

        emit TaskCancelled(_taskId, task.requester, task.paymentAmount);
        emit DebugLog("cancelTask", msg.sender, _taskId, block.timestamp);
    }

    function claimExpiredTask(
        uint256 _taskId
    ) external validTask(_taskId) nonReentrant {
        Task storage task = tasks[_taskId];
        require(block.timestamp >= task.expiresAt, "Not expired");
        require(
            task.status == TaskStatus.Open ||
                task.status == TaskStatus.InProgress,
            "Already finalized"
        );
        require(msg.sender == task.requester, "Only requester");

        task.status = TaskStatus.Expired;
        cUSD.safeTransfer(task.requester, task.paymentAmount);

        emit TaskExpired(_taskId, task.requester, task.paymentAmount);
        emit DebugLog("claimExpiredTask", msg.sender, _taskId, block.timestamp);
    }

    function withdrawPlatformFees() external onlyOwner nonReentrant {
        uint256 amount = platformFeesAccumulated;
        require(amount > 0, "No fees");
        platformFeesAccumulated = 0;
        cUSD.safeTransfer(owner(), amount);

        emit PlatformFeesWithdrawn(owner(), amount);
        emit DebugLog("withdrawPlatformFees", msg.sender, 0, block.timestamp);
    }

    // ============ Views ============
    function getTask(
        uint256 _taskId
    ) external view validTask(_taskId) returns (Task memory) {
        return tasks[_taskId];
    }

    function isTaskExpired(
        uint256 _taskId
    ) external view validTask(_taskId) returns (bool) {
        return block.timestamp >= tasks[_taskId].expiresAt;
    }

    function getContractBalance() external view returns (uint256) {
        return cUSD.balanceOf(address(this));
    }

    // ============ Admin Controls ============
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
