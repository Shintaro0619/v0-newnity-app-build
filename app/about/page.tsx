import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Zap,
  Shield,
  TrendingDown,
  Globe,
  Users,
  Heart,
  ArrowRight,
  CheckCircle2,
  XCircle,
  ChevronRight,
} from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="pt-32 pb-16 border-b border-primary/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="text-white">The Creator Economy is </span>
              <span className="text-red-500">Broken</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Traditional platforms take up to 17% in fees, leaving creators struggling to sustain themselves
            </p>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 bg-gradient-to-b from-red-950/20 to-transparent">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-red-950/30 border-red-900/50">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <TrendingDown className="w-6 h-6 text-red-500" />
                  <h2 className="text-2xl font-bold text-white">Current Reality</h2>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-red-400 font-semibold">17% fees</span>
                      <span className="text-gray-300"> in Japan's crowdfunding market</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-red-400 font-semibold">One-off support</span>
                      <span className="text-gray-300"> with no ongoing relationship</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-red-400 font-semibold">Major label artists</span>
                      <span className="text-gray-300"> taking part-time jobs</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-red-400 font-semibold">Opaque processes</span>
                      <span className="text-gray-300"> and delayed payments</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-red-400 font-semibold">No creator-fan</span>
                      <span className="text-gray-300"> community building</span>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Arrow Transition */}
      <div className="flex justify-center py-8">
        <div className="bg-primary/20 rounded-full p-4">
          <ArrowRight className="w-8 h-8 text-primary" />
        </div>
      </div>

      {/* Solution Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-white">Introducing </span>
              <span className="text-primary glow-text">newnity</span>
            </h2>
            <p className="text-xl text-gray-300">A revolutionary USDC crowdfunding platform that puts creators first</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card className="bg-gray-900 border-primary/20 hover:border-primary/40 transition-all">
              <CardContent className="p-6">
                <div className="bg-primary/20 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                  <TrendingDown className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Fair Fees</h3>
                <p className="text-gray-400 mb-4">
                  Platform fees reduced from 10-17% to just 3-4%, with tiered pricing based on funding success
                </p>
                <div className="text-primary font-bold text-2xl">10% → 3%</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-primary/20 hover:border-primary/40 transition-all">
              <CardContent className="p-6">
                <div className="bg-primary/20 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">100% Transparent</h3>
                <p className="text-gray-400 mb-4">
                  Smart contract escrow with milestone-based releases. Every transaction visible on-chain
                </p>
                <div className="text-primary font-bold text-2xl">100%</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-primary/20 hover:border-primary/40 transition-all">
              <CardContent className="p-6">
                <div className="bg-primary/20 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Lightning Fast</h3>
                <p className="text-gray-400 mb-4">
                  Lightning-fast transactions with minimal fees. Instant settlements, no 14-day waits
                </p>
                <div className="text-primary font-bold text-2xl">&lt;60s</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-primary/20 hover:border-primary/40 transition-all">
              <CardContent className="p-6">
                <div className="bg-primary/20 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">FanFi Layer</h3>
                <p className="text-gray-400">
                  Build lasting relationships with supporters. Proof-of-Fandom XP system rewards loyal fans with
                  exclusive perks
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-primary/20 hover:border-primary/40 transition-all">
              <CardContent className="p-6">
                <div className="bg-primary/20 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Borderless Access</h3>
                <p className="text-gray-400">
                  USDC stablecoin payments accepted globally. Support creators from 190+ countries without currency
                  barriers
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-primary/20 hover:border-primary/40 transition-all">
              <CardContent className="p-6">
                <div className="bg-primary/20 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Direct Connection</h3>
                <p className="text-gray-400">
                  Wallet-to-wallet messaging and airdrops. Creators can reward supporters directly without
                  intermediaries
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gradient-to-b from-primary/5 to-transparent border-y border-primary/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">How It Works</h2>

            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-primary font-bold text-xl">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Create Your Campaign</h3>
                  <p className="text-gray-400">
                    Set your funding goal, milestones, and rewards. Our platform guides you through the process with
                    best practices
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-primary font-bold text-xl">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Receive USDC Support</h3>
                  <p className="text-gray-400">
                    Fans pledge using USDC stablecoin. Funds are held in transparent smart contract escrow until
                    milestones are met
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-primary font-bold text-xl">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Build Your Community</h3>
                  <p className="text-gray-400">
                    Engage with supporters through updates, exclusive content, and direct messaging. Reward loyalty with
                    FanFi perks
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-primary font-bold text-xl">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Deliver & Grow</h3>
                  <p className="text-gray-400">
                    Complete milestones to unlock funds. Keep supporters engaged for future projects with your built-in
                    community
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">Platform Features</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <CheckCircle2 className="w-8 h-8 text-primary mb-3" />
                  <h3 className="text-lg font-bold text-white mb-2">Smart Contract Escrow</h3>
                  <p className="text-gray-400 text-sm">
                    Automated fund management with milestone-based releases and community voting
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <CheckCircle2 className="w-8 h-8 text-primary mb-3" />
                  <h3 className="text-lg font-bold text-white mb-2">T-Bill Yield Generation</h3>
                  <p className="text-gray-400 text-sm">
                    Escrowed funds earn yield through tokenized T-Bills, benefiting both creators and backers
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <CheckCircle2 className="w-8 h-8 text-primary mb-3" />
                  <h3 className="text-lg font-bold text-white mb-2">Account Abstraction</h3>
                  <p className="text-gray-400 text-sm">
                    Gasless transactions and social login for seamless Web3 experience
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <CheckCircle2 className="w-8 h-8 text-primary mb-3" />
                  <h3 className="text-lg font-bold text-white mb-2">Multi-Chain Support</h3>
                  <p className="text-gray-400 text-sm">
                    Base, Ethereum, and other EVM chains supported for maximum flexibility
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <CheckCircle2 className="w-8 h-8 text-primary mb-3" />
                  <h3 className="text-lg font-bold text-white mb-2">ERC-6551 Wallets</h3>
                  <p className="text-gray-400 text-sm">
                    Token-bound accounts enable direct creator-to-fan communication and airdrops
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <CheckCircle2 className="w-8 h-8 text-primary mb-3" />
                  <h3 className="text-lg font-bold text-white mb-2">Proof-of-Fandom XP</h3>
                  <p className="text-gray-400 text-sm">
                    Gamified loyalty system that rewards supporters with exclusive benefits and access
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-b from-primary/10 to-transparent border-t border-primary/20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Ready to Join the Revolution?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Be part of the future where creators thrive and support keeps circulating
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/create">
              <Button className="bg-primary hover:bg-primary/90 text-black font-bold px-8 py-6 text-lg glow-primary">
                Launch Your Campaign
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/campaigns">
              <Button
                variant="outline"
                className="border-primary/30 text-white hover:bg-primary/10 px-8 py-6 text-lg bg-transparent"
              >
                Explore Campaigns
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
