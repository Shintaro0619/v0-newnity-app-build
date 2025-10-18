import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Rocket,
  Users,
  CheckCircle,
  RefreshCw,
  Shield,
  Flag,
  MessageSquare,
  BarChart3,
  Coins,
  Zap,
  TrendingUp,
  Quote,
} from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Grid Background */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, #00ff21 1px, transparent 1px),
              linear-gradient(to bottom, #00ff21 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-primary/30 bg-primary/10 mb-12">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-primary font-medium">Pre-seed Funding Round Open</span>
            </div>

            {/* Main Logo */}
            <h1 className="text-7xl md:text-8xl font-bold mb-8">
              <span className="text-white">new</span>
              <span className="text-primary glow-text">nity</span>
            </h1>

            {/* Tagline */}
            <p className="text-2xl md:text-3xl text-gray-300 mb-6 leading-relaxed">
              Where passion meets purpose. The first USDC crowdfunding platform designed for creators, powered by{" "}
              <span className="text-primary">Base L2</span> and <span className="text-primary">FanFi</span>.
            </p>

            <p className="text-xl text-gray-400 mb-16">
              Support that keeps circulating. Transparent escrow. Fair fees. Real relationships.
            </p>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card className="bg-gray-900/50 border-gray-800 p-6 backdrop-blur-sm">
                <Users className="w-8 h-8 text-primary mb-4 mx-auto" />
                <div className="text-3xl font-bold text-white mb-2">10%→3%</div>
                <div className="text-gray-400">Platform Fees</div>
              </Card>

              <Card className="bg-gray-900/50 border-gray-800 p-6 backdrop-blur-sm">
                <Shield className="w-8 h-8 text-primary mb-4 mx-auto" />
                <div className="text-3xl font-bold text-white mb-2">100%</div>
                <div className="text-gray-400">Transparent</div>
              </Card>

              <Card className="bg-gray-900/50 border-gray-800 p-6 backdrop-blur-sm">
                <Zap className="w-8 h-8 text-primary mb-4 mx-auto" />
                <div className="text-3xl font-bold text-white mb-2">Base L2</div>
                <div className="text-gray-400">Powered</div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-gradient-to-b from-red-950/20 to-transparent">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="text-white">The Creator Economy is </span>
              <span className="text-red-500">Broken</span>
            </h2>
            <p className="text-xl text-gray-400">
              Traditional platforms take up to 17% in fees, leaving creators struggling to sustain themselves
            </p>
          </div>

          <Card className="max-w-3xl mx-auto bg-red-950/30 border-red-900/50 p-8">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-red-500 rotate-180" />
              <h3 className="text-2xl font-bold text-white">Current Reality</h3>
            </div>
            <ul className="space-y-4 text-lg">
              <li className="text-gray-300">
                <span className="text-red-400 font-semibold">17% fees</span> in Japan's crowdfunding market
              </li>
              <li className="text-gray-300">
                <span className="text-red-400 font-semibold">One-off support</span> with no ongoing relationship
              </li>
              <li className="text-gray-300">
                <span className="text-red-400 font-semibold">Major label artists</span> taking part-time jobs
              </li>
              <li className="text-gray-300">
                <span className="text-red-400 font-semibold">Opaque processes</span> and delayed payments
              </li>
              <li className="text-gray-300">
                <span className="text-red-400 font-semibold">No creator-fan</span> community building
              </li>
            </ul>
          </Card>
        </div>
      </section>

      {/* Meet newnity Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="text-white">Meet </span>
              <span className="text-primary glow-text">newnity</span>
            </h2>
            <p className="text-xl text-gray-400">
              Support that keeps circulating. A platform where creators thrive and fans build lasting connections.
            </p>
          </div>

          <Card className="max-w-5xl mx-auto bg-gray-900/50 border-gray-800 p-8">
            <div className="flex items-center gap-3 mb-8">
              <TrendingUp className="w-6 h-6 text-primary" />
              <h3 className="text-2xl font-bold text-white">The newnity Advantage</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <Zap className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="text-lg font-bold text-primary mb-2">Fair Fees (3-5%)</h4>
                  <p className="text-gray-400">More support reaches creators directly</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Zap className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="text-lg font-bold text-primary mb-2">FanFi Ecosystem</h4>
                  <p className="text-gray-400">Ongoing relationships and re-support mechanisms</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Zap className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="text-lg font-bold text-primary mb-2">Transparent Escrow</h4>
                  <p className="text-gray-400">Smart contracts ensure trust and security</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Zap className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="text-lg font-bold text-primary mb-2">Base L2 Powered</h4>
                  <p className="text-gray-400">Fast, cheap, and secure transactions</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Zap className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="text-lg font-bold text-primary mb-2">Milestone Voting</h4>
                  <p className="text-gray-400">Community-driven project validation</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Zap className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="text-lg font-bold text-primary mb-2">Creator SaaS Tools</h4>
                  <p className="text-gray-400">Analytics, CRM, and community management</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Revolutionary Features Section */}
      <section className="py-20 bg-gradient-to-b from-gray-900/50 to-transparent">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center mb-12">
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="text-white">Revolutionary </span>
              <span className="text-primary glow-text">Features</span>
            </h2>
            <p className="text-xl text-gray-400">Built for creators, designed for fans, powered by Web3</p>
          </div>

          {/* Top 3 Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-6xl mx-auto">
            <Card className="bg-gray-900/50 border-gray-800 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-primary/20">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm font-medium text-primary">100% Secure</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Smart Escrow System</h3>
              <p className="text-gray-400">
                All-or-Nothing campaigns with secure USDC escrow. Funds only release when milestones are met.
              </p>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-primary/20">
                  <Flag className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm font-medium text-primary">Democratic</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Community Voting</h3>
              <p className="text-gray-400">
                ≥60% milestone voting ensures creators deliver on promises. Community-driven accountability.
              </p>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-primary/20">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm font-medium text-primary">Web3 Native</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">ERC-6551 DM</h3>
              <p className="text-gray-400">
                Direct messaging between creators and supporters using advanced blockchain technology.
              </p>
            </Card>
          </div>

          {/* Bottom 3 Features */}
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card className="bg-gray-900/50 border-gray-800 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-primary/20">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm font-medium text-primary">Data Driven</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Creator SaaS Suite</h3>
              <p className="text-gray-400">
                Comprehensive analytics, CRM, and community management tools for creators.
              </p>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-primary/20">
                  <Coins className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm font-medium text-primary">Tokenomics</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Dual-Asset Design</h3>
              <p className="text-gray-400">
                $NEWY governance token + peUSD utility certificates create sustainable economics.
              </p>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-primary/20">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm font-medium text-primary">Lightning Fast</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Base L2 Infrastructure</h3>
              <p className="text-gray-400">Lightning-fast transactions with minimal fees on Coinbase's Base network.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* How newnity Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center mb-12">
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="text-white">How </span>
              <span className="text-primary glow-text">newnity</span>
              <span className="text-white"> Works</span>
            </h2>
            <p className="text-xl text-gray-400">A simple, transparent process that puts creators and fans first</p>
          </div>

          {/* 4 Steps Overview */}
          <div className="grid md:grid-cols-4 gap-6 mb-12 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="p-4 rounded-2xl bg-blue-900/30 border border-blue-800/50 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Rocket className="w-8 h-8 text-blue-400" />
              </div>
              <div className="text-sm text-primary mb-2">Step 1</div>
              <h3 className="text-xl font-bold text-white">Create Campaign</h3>
            </div>

            <div className="text-center">
              <div className="p-4 rounded-2xl bg-purple-900/30 border border-purple-800/50 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="w-8 h-8 text-purple-400" />
              </div>
              <div className="text-sm text-primary mb-2">Step 2</div>
              <h3 className="text-xl font-bold text-white">Community Backs</h3>
            </div>

            <div className="text-center">
              <div className="p-4 rounded-2xl bg-green-900/30 border border-green-800/50 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <div className="text-sm text-primary mb-2">Step 3</div>
              <h3 className="text-xl font-bold text-white">Milestones & Voting</h3>
            </div>

            <div className="text-center">
              <div className="p-4 rounded-2xl bg-orange-900/30 border border-orange-800/50 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-orange-400" />
              </div>
              <div className="text-sm text-primary mb-2">Step 4</div>
              <h3 className="text-xl font-bold text-white">Ongoing Relationship</h3>
            </div>
          </div>

          {/* Detailed Step Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            <Card className="bg-blue-950/30 border-blue-900/50 p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-xl bg-blue-900/50">
                  <Rocket className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <div className="text-sm text-primary mb-1">Step 1</div>
                  <h3 className="text-2xl font-bold text-white">Create Campaign</h3>
                </div>
              </div>
              <p className="text-gray-300">
                Creators set up their project with clear milestones and funding goals using our intuitive campaign
                factory.
              </p>
            </Card>

            <Card className="bg-purple-950/30 border-purple-900/50 p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-xl bg-purple-900/50">
                  <Users className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <div className="text-sm text-primary mb-1">Step 2</div>
                  <h3 className="text-2xl font-bold text-white">Community Backs</h3>
                </div>
              </div>
              <p className="text-gray-300">
                Fans discover and support projects with USDC. Funds are held in secure escrow until milestones are met.
              </p>
            </Card>

            <Card className="bg-green-950/30 border-green-900/50 p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-xl bg-green-900/50">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <div className="text-sm text-primary mb-1">Step 3</div>
                  <h3 className="text-2xl font-bold text-white">Milestones & Voting</h3>
                </div>
              </div>
              <p className="text-gray-300">
                Community votes on milestone completion (≥60% threshold). Creators receive funds progressively.
              </p>
            </Card>

            <Card className="bg-orange-950/30 border-orange-900/50 p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-xl bg-orange-900/50">
                  <RefreshCw className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <div className="text-sm text-primary mb-1">Step 4</div>
                  <h3 className="text-2xl font-bold text-white">Ongoing Relationship</h3>
                </div>
              </div>
              <p className="text-gray-300">
                FanFi mechanisms enable re-support, community building, and long-term creator-fan relationships.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* The Result Section */}
      <section className="py-20 bg-gradient-to-b from-green-950/20 to-transparent">
        <div className="container mx-auto px-4">
          <Card className="max-w-5xl mx-auto bg-green-950/30 border-green-900/50 p-12">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-12">
              <span className="text-white">The Result: </span>
              <span className="text-primary glow-text">Support That Keeps Circulating</span>
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-5xl font-bold text-primary mb-3">90%+</div>
                <div className="text-xl text-gray-300">Funds to Creators</div>
              </div>

              <div className="text-center">
                <div className="text-5xl font-bold text-primary mb-3">100%</div>
                <div className="text-xl text-gray-300">Transparency</div>
              </div>

              <div className="text-center">
                <div className="text-5xl font-bold text-primary mb-3">∞</div>
                <div className="text-xl text-gray-300">Ongoing Support</div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Founder Story Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto bg-gray-900/50 border-gray-800 p-12">
            <Quote className="w-12 h-12 text-primary mb-8" />

            <div className="space-y-6 text-lg text-gray-300 leading-relaxed">
              <p>
                "My career began in the media and entertainment industry. While producing programs, live concerts, and
                events for thousands, I also scouted and developed musicians. In Japan, the shift to digital
                distribution visibly shrank revenues at major record companies.
              </p>

              <p>
                Many artists—even those signed to major labels—had to take part-time jobs to make ends meet. Given that
                conventional crowdfunding often costs around{" "}
                <span className="text-primary font-semibold">10% (and about 17% in Japan)</span>, I strongly felt that
                more of fans' support should reach creators.
              </p>

              <p>
                Yet, even talented individuals often struggle to focus on their creative work, and some are forced to
                give up altogether. I envisioned newnity as a platform to connect these undiscovered talents with their
                fans, fostering new relationships and ensuring that more support from fans and backers reaches the
                creators directly.
              </p>

              <p>
                I want to realize a{" "}
                <span className="text-primary font-semibold">flywheel of support—'backing that keeps circulating'</span>
                —rather than a one-off interaction. That is newnity.
              </p>

              <p>
                The name 'newnity' combines 'new' with ideas like Unity, Community, and Opportunity—a coined term
                representing our vision."
              </p>
            </div>

            <div className="flex items-center gap-4 mt-12 pt-8 border-t border-gray-800">
              <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">S</span>
              </div>
              <div>
                <div className="text-xl font-bold text-white">Shintaro Soyama</div>
                <div className="text-gray-400">Founder, newnity</div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-gray-800">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-white">Ready to Join </span>
            <span className="text-primary glow-text">newnity</span>
            <span className="text-white">?</span>
          </h2>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Be part of the future where creators thrive and support keeps circulating
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/create">
              <Button className="bg-primary hover:bg-primary/90 text-black font-bold px-8 py-6 text-lg glow-primary">
                Start Your Campaign
              </Button>
            </Link>
            <Link href="/campaigns">
              <Button
                variant="outline"
                className="border-primary/30 text-white hover:bg-primary/10 px-8 py-6 text-lg bg-transparent"
              >
                Explore Projects
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
