// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CampaignEscrow
 * @notice Simple All-or-Nothing escrow for crowdfunding campaigns
 * @dev Holds USDC pledges until campaign ends, then releases to creator or refunds backers
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Copy this entire file to Remix IDE
 * 2. Compile with Solidity 0.8.20
 * 3. Deploy with constructor parameters:
 *    - _usdcToken: NEXT_PUBLIC_MOCK_USDC_BASE_SEPOLIA value from Vercel
 *    - _platformWallet: PLATFORM_WALLET value from Vercel
 * 4. Copy the deployed contract address
 * 5. Update NEXT_PUBLIC_ESCROW_VAULT_BASE_SEPOLIA in Vercel
 */
contract CampaignEscrow is ReentrancyGuard, Ownable {
    IERC20 public immutable usdcToken;
    
    struct Campaign {
        address creator;
        uint256 goalAmount;
        uint256 totalPledged;
        uint256 deadline;
        bool finalized;
        bool successful;
        uint256 platformFeePercent; // in basis points (e.g., 500 = 5%)
    }
    
    struct Pledge {
        uint256 amount;
        bool refunded;
    }
    
    // Campaign ID => Campaign data
    mapping(uint256 => Campaign) public campaigns;
    
    // Campaign ID => Backer address => Pledge data
    mapping(uint256 => mapping(address => Pledge)) public pledges;
    
    // Campaign ID => Array of backer addresses
    mapping(uint256 => address[]) public backers;
    
    uint256 public nextCampaignId = 1;
    address public platformWallet;
    
    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed creator,
        uint256 goalAmount,
        uint256 deadline
    );
    
    event PledgeMade(
        uint256 indexed campaignId,
        address indexed backer,
        uint256 amount
    );
    
    event CampaignFinalized(
        uint256 indexed campaignId,
        bool successful,
        uint256 totalAmount
    );
    
    event FundsReleased(
        uint256 indexed campaignId,
        address indexed creator,
        uint256 amount,
        uint256 platformFee
    );
    
    event RefundIssued(
        uint256 indexed campaignId,
        address indexed backer,
        uint256 amount
    );
    
    constructor(address _usdcToken, address _platformWallet) Ownable(msg.sender) {
        require(_usdcToken != address(0), "Invalid USDC address");
        require(_platformWallet != address(0), "Invalid platform wallet");
        usdcToken = IERC20(_usdcToken);
        platformWallet = _platformWallet;
    }
    
    /**
     * @notice Create a new campaign
     * @param _goalAmount Target funding amount in USDC (with 6 decimals)
     * @param _durationDays Campaign duration in days
     * @param _platformFeePercent Platform fee in basis points (e.g., 500 = 5%)
     */
    function createCampaign(
        uint256 _goalAmount,
        uint256 _durationDays,
        uint256 _platformFeePercent
    ) external returns (uint256) {
        require(_goalAmount > 0, "Goal must be > 0");
        require(_durationDays > 0 && _durationDays <= 365, "Invalid duration");
        require(_platformFeePercent <= 1000, "Fee too high"); // Max 10%
        
        uint256 campaignId = nextCampaignId++;
        uint256 deadline = block.timestamp + (_durationDays * 1 days);
        
        campaigns[campaignId] = Campaign({
            creator: msg.sender,
            goalAmount: _goalAmount,
            totalPledged: 0,
            deadline: deadline,
            finalized: false,
            successful: false,
            platformFeePercent: _platformFeePercent
        });
        
        emit CampaignCreated(campaignId, msg.sender, _goalAmount, deadline);
        
        return campaignId;
    }
    
    /**
     * @notice Pledge USDC to a campaign
     * @param _campaignId Campaign to pledge to
     * @param _amount Amount of USDC to pledge (with 6 decimals)
     */
    function pledge(uint256 _campaignId, uint256 _amount) external nonReentrant {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.creator != address(0), "Campaign does not exist");
        require(block.timestamp < campaign.deadline, "Campaign ended");
        require(!campaign.finalized, "Campaign finalized");
        require(_amount > 0, "Amount must be > 0");
        
        // Transfer USDC from backer to this contract
        require(
            usdcToken.transferFrom(msg.sender, address(this), _amount),
            "USDC transfer failed"
        );
        
        // Record pledge
        if (pledges[_campaignId][msg.sender].amount == 0) {
            backers[_campaignId].push(msg.sender);
        }
        
        pledges[_campaignId][msg.sender].amount += _amount;
        campaign.totalPledged += _amount;
        
        emit PledgeMade(_campaignId, msg.sender, _amount);
    }
    
    /**
     * @notice Finalize campaign after deadline
     * @param _campaignId Campaign to finalize
     */
    function finalizeCampaign(uint256 _campaignId) external nonReentrant {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.creator != address(0), "Campaign does not exist");
        require(block.timestamp >= campaign.deadline, "Campaign not ended");
        require(!campaign.finalized, "Already finalized");
        
        campaign.finalized = true;
        campaign.successful = campaign.totalPledged >= campaign.goalAmount;
        
        emit CampaignFinalized(_campaignId, campaign.successful, campaign.totalPledged);
        
        // If successful, release funds to creator
        if (campaign.successful) {
            _releaseFunds(_campaignId);
        }
    }
    
    /**
     * @notice Release funds to creator (internal)
     */
    function _releaseFunds(uint256 _campaignId) private {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.successful, "Campaign not successful");
        
        uint256 totalAmount = campaign.totalPledged;
        uint256 platformFee = (totalAmount * campaign.platformFeePercent) / 10000;
        uint256 creatorAmount = totalAmount - platformFee;
        
        // Transfer platform fee
        if (platformFee > 0) {
            require(
                usdcToken.transfer(platformWallet, platformFee),
                "Platform fee transfer failed"
            );
        }
        
        // Transfer remaining to creator
        require(
            usdcToken.transfer(campaign.creator, creatorAmount),
            "Creator transfer failed"
        );
        
        emit FundsReleased(_campaignId, campaign.creator, creatorAmount, platformFee);
    }
    
    /**
     * @notice Claim refund if campaign failed
     * @param _campaignId Campaign to refund from
     */
    function claimRefund(uint256 _campaignId) external nonReentrant {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.finalized, "Campaign not finalized");
        require(!campaign.successful, "Campaign was successful");
        
        Pledge storage backerPledge = pledges[_campaignId][msg.sender];
        require(backerPledge.amount > 0, "No pledge found");
        require(!backerPledge.refunded, "Already refunded");
        
        uint256 refundAmount = backerPledge.amount;
        backerPledge.refunded = true;
        
        require(
            usdcToken.transfer(msg.sender, refundAmount),
            "Refund transfer failed"
        );
        
        emit RefundIssued(_campaignId, msg.sender, refundAmount);
    }
    
    /**
     * @notice Get campaign details
     */
    function getCampaign(uint256 _campaignId) external view returns (
        address creator,
        uint256 goalAmount,
        uint256 totalPledged,
        uint256 deadline,
        bool finalized,
        bool successful,
        uint256 platformFeePercent
    ) {
        Campaign storage campaign = campaigns[_campaignId];
        return (
            campaign.creator,
            campaign.goalAmount,
            campaign.totalPledged,
            campaign.deadline,
            campaign.finalized,
            campaign.successful,
            campaign.platformFeePercent
        );
    }
    
    /**
     * @notice Get backer's pledge amount
     */
    function getPledge(uint256 _campaignId, address _backer) external view returns (
        uint256 amount,
        bool refunded
    ) {
        Pledge storage backerPledge = pledges[_campaignId][_backer];
        return (backerPledge.amount, backerPledge.refunded);
    }
    
    /**
     * @notice Get all backers for a campaign
     */
    function getBackers(uint256 _campaignId) external view returns (address[] memory) {
        return backers[_campaignId];
    }
    
    /**
     * @notice Update platform wallet (only owner)
     */
    function updatePlatformWallet(address _newWallet) external onlyOwner {
        require(_newWallet != address(0), "Invalid address");
        platformWallet = _newWallet;
    }
}
