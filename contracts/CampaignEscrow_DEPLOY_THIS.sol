// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CampaignEscrow
 * @notice Escrow contract for crowdfunding campaigns with USDC
 * @dev Uses official Base Sepolia USDC: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
 */

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract CampaignEscrow {
    // State variables
    IERC20 public immutable usdcToken;
    address public immutable platformWallet;
    uint256 public nextCampaignId;
    
    struct Campaign {
        address creator;
        uint256 goalAmount;
        uint256 pledgedAmount;
        uint256 deadline;
        bool finalized;
        uint256 platformFeePercent; // in basis points (e.g., 500 = 5%)
    }
    
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(address => uint256)) public pledges;
    
    // Events
    event CampaignCreated(uint256 indexed campaignId, address indexed creator, uint256 goalAmount, uint256 deadline);
    event PledgeMade(uint256 indexed campaignId, address indexed backer, uint256 amount);
    event CampaignFinalized(uint256 indexed campaignId, bool successful, uint256 totalAmount);
    event RefundIssued(uint256 indexed campaignId, address indexed backer, uint256 amount);
    
    /**
     * @notice Constructor
     * @param _usdcAddress Address of USDC token (Base Sepolia: 0x036CbD53842c5426634e7929541eC2318f3dCF7e)
     * @param _platformWallet Address to receive platform fees
     */
    constructor(address _usdcAddress, address _platformWallet) {
        require(_usdcAddress != address(0), "Invalid USDC address");
        require(_platformWallet != address(0), "Invalid platform wallet");
        
        usdcToken = IERC20(_usdcAddress);
        platformWallet = _platformWallet;
        nextCampaignId = 1;
    }
    
    /**
     * @notice Create a new campaign
     * @param _goalAmount Target amount in USDC (with 6 decimals)
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
            pledgedAmount: 0,
            deadline: deadline,
            finalized: false,
            platformFeePercent: _platformFeePercent
        });
        
        emit CampaignCreated(campaignId, msg.sender, _goalAmount, deadline);
        return campaignId;
    }
    
    /**
     * @notice Pledge USDC to a campaign
     * @param _campaignId ID of the campaign
     * @param _amount Amount of USDC to pledge (with 6 decimals)
     */
    function pledge(uint256 _campaignId, uint256 _amount) external {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.creator != address(0), "Campaign does not exist");
        require(block.timestamp < campaign.deadline, "Campaign ended");
        require(!campaign.finalized, "Campaign finalized");
        require(_amount > 0, "Amount must be > 0");
        
        require(
            usdcToken.transferFrom(msg.sender, address(this), _amount),
            "USDC transfer failed"
        );
        
        pledges[_campaignId][msg.sender] += _amount;
        campaign.pledgedAmount += _amount;
        
        emit PledgeMade(_campaignId, msg.sender, _amount);
    }
    
    /**
     * @notice Finalize a campaign and distribute funds
     * @param _campaignId ID of the campaign
     */
    function finalizeCampaign(uint256 _campaignId) external {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.creator == msg.sender, "Only creator can finalize");
        require(block.timestamp >= campaign.deadline, "Campaign not ended");
        require(!campaign.finalized, "Already finalized");
        
        campaign.finalized = true;
        bool successful = campaign.pledgedAmount >= campaign.goalAmount;
        
        if (successful && campaign.pledgedAmount > 0) {
            uint256 platformFee = (campaign.pledgedAmount * campaign.platformFeePercent) / 10000;
            uint256 creatorAmount = campaign.pledgedAmount - platformFee;
            
            if (platformFee > 0) {
                require(usdcToken.transfer(platformWallet, platformFee), "Platform fee transfer failed");
            }
            require(usdcToken.transfer(campaign.creator, creatorAmount), "Creator transfer failed");
        }
        
        emit CampaignFinalized(_campaignId, successful, campaign.pledgedAmount);
    }
    
    /**
     * @notice Refund a backer if campaign failed
     * @param _campaignId ID of the campaign
     */
    function refund(uint256 _campaignId) external {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.finalized, "Campaign not finalized");
        require(campaign.pledgedAmount < campaign.goalAmount, "Campaign was successful");
        
        uint256 pledgedAmount = pledges[_campaignId][msg.sender];
        require(pledgedAmount > 0, "No pledge to refund");
        
        pledges[_campaignId][msg.sender] = 0;
        require(usdcToken.transfer(msg.sender, pledgedAmount), "Refund transfer failed");
        
        emit RefundIssued(_campaignId, msg.sender, pledgedAmount);
    }
    
    /**
     * @notice Get campaign details
     * @param _campaignId ID of the campaign
     */
    function getCampaign(uint256 _campaignId) external view returns (
        address creator,
        uint256 goalAmount,
        uint256 pledgedAmount,
        uint256 deadline,
        bool finalized,
        bool successful,
        uint256 platformFeePercent
    ) {
        Campaign memory campaign = campaigns[_campaignId];
        require(campaign.creator != address(0), "Campaign does not exist");
        
        successful = campaign.pledgedAmount >= campaign.goalAmount;
        
        return (
            campaign.creator,
            campaign.goalAmount,
            campaign.pledgedAmount,
            campaign.deadline,
            campaign.finalized,
            successful,
            campaign.platformFeePercent
        );
    }
    
    /**
     * @notice Get pledge amount for a backer
     * @param _campaignId ID of the campaign
     * @param _backer Address of the backer
     */
    function getPledge(uint256 _campaignId, address _backer) external view returns (uint256) {
        return pledges[_campaignId][_backer];
    }
}
