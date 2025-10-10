import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="border-t border-primary/20 bg-black">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-3">
            <h3 className="text-xl font-bold">
              <span className="text-white">new</span>
              <span className="text-primary">nity</span>
            </h3>
            <p className="text-sm text-gray-400">Where passion meets purpose. USDC crowdfunding on newnity.</p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-semibold text-white mb-3">Platform</h4>
            <nav className="flex flex-col gap-2 text-sm text-gray-400">
              <a href="#about" className="hover:text-primary transition-colors">
                About
              </a>
              <a href="#howItWorks" className="hover:text-primary transition-colors">
                How it works
              </a>
              <a href="#faq" className="hover:text-primary transition-colors">
                FAQ
              </a>
              <a href="#fees" className="hover:text-primary transition-colors">
                Fees
              </a>
            </nav>
          </div>

          {/* Discover */}
          <div>
            <h4 className="font-semibold text-white mb-3">Discover</h4>
            <nav className="flex flex-col gap-2 text-sm text-gray-400">
              <Link href="/campaigns" className="hover:text-primary transition-colors">
                All Campaigns
              </Link>
              <Link href="/create" className="hover:text-primary transition-colors">
                Start a Campaign
              </Link>
            </nav>
          </div>

          {/* Community */}
          <div>
            <h4 className="font-semibold text-white mb-3">Community</h4>
            <nav className="flex flex-col gap-2 text-sm text-gray-400">
              <a href="#" className="hover:text-primary transition-colors">
                Twitter
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                Discord
              </a>
            </nav>
          </div>
        </div>

        <div className="pt-8 border-t border-primary/20 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} newnity. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
