# Newnity Architecture

## System Overview

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Campaign   │  │    Pledge    │  │   Dashboard  │      │
│  │   Creation   │  │    Modal     │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                    ┌───────▼────────┐                        │
│                    │  Wagmi Hooks   │                        │
│                    └───────┬────────┘                        │
└────────────────────────────┼──────────────────────────────────┘
                             │
                    ┌────────▼─────────┐
                    │   MetaMask/WC    │
                    └────────┬─────────┘
                             │
        ┏━━━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━━┓
        ┃          Base Sepolia (L2)                ┃
        ┃  ┌──────────────────────────────────┐    ┃
        ┃  │     CampaignEscrow Contract      │    ┃
        ┃  │  0x7724...45cd                   │    ┃
        ┃  │                                  │    ┃
        ┃  │  - createCampaign()              │    ┃
        ┃  │  - pledge()                      │    ┃
        ┃  │  - finalizeCampaign()            │    ┃
        ┃  │  - refund()                      │    ┃
        ┃  └──────────────┬───────────────────┘    ┃
        ┃                 │                         ┃
        ┃  ┌──────────────▼───────────────────┐    ┃
        ┃  │      USDC Token Contract         │    ┃
        ┃  │  0x036C...CF7e                   │    ┃
        ┃  └──────────────────────────────────┘    ┃
        ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                             │
        ┌────────────────────▼────────────────────┐
        │      PostgreSQL Database (Neon)         │
        │  - Campaign metadata                    │
        │  - User profiles                        │
        │  - Off-chain data cache                 │
        └─────────────────────────────────────────┘
\`\`\`

## Smart Contract Architecture

### CampaignEscrow.sol

**State Variables**:
- `usdcToken`: IERC20 - USDC contract reference
- `platformFeePercent`: uint256 - Platform fee (5%)
- `platformWallet`: address - Fee recipient
- `campaigns`: mapping(uint256 => Campaign) - Campaign storage
- `pledges`: mapping(uint256 => mapping(address => uint256)) - Pledge tracking

**Key Structs**:
\`\`\`solidity
struct Campaign {
    address creator;
    uint256 goal;
    uint256 deadline;
    uint256 totalPledged;
    bool finalized;
    bool successful;
}
