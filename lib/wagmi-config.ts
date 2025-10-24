import { createConfig, http } from "wagmi"
import { base, baseSepolia } from "viem/chains"
import { injected, coinbaseWallet, walletConnect } from "@wagmi/connectors"
import { createStorage } from "wagmi"

const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? ""
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "newnity"
const APP_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://newnity.vercel.app"
const APP_ICON = `${APP_URL}/icon.png`

const connectors = [
  injected({ shimDisconnect: true }),
  coinbaseWallet({ appName: APP_NAME }),
  ...(WC_PROJECT_ID
    ? [
        walletConnect({
          projectId: WC_PROJECT_ID,
          showQrModal: true,
          metadata: {
            name: APP_NAME,
            description: "newnity",
            url: APP_URL,
            icons: [APP_ICON],
          },
        }),
      ]
    : []),
]

export const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
  connectors,
  ssr: true,
  storage: createStorage({
    storage: typeof window !== "undefined" ? window.sessionStorage : undefined,
  }),
  autoConnect: false,
})

export const config = wagmiConfig
