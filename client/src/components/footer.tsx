import { Link } from "wouter";

export default function Footer() {
  return (
    <div className="bg-gradient-to-b from-gray-900 to-black">
      {/* Animated accent line */}
      <div className="h-1 bg-gradient-to-r from-transparent via-indigo-600 to-transparent opacity-50 animate-pulse"></div>

      <footer className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 text-white relative overflow-hidden">
        {/* Space nebula overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-800/15 via-transparent to-purple-900/10 opacity-40"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {/* Logo and Company Info */}
            <div className="md:col-span-1">
              <div className="flex items-center space-x-3 mb-4">
                <img 
                  src="/assets/axiom-logo.png" 
                  alt="Axiom Logo" 
                  className="w-12 h-12 rounded-full"
                  data-testid="img-axiom-logo"
                />
                <span className="text-white font-semibold text-lg">Axiom</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed ">
                We are a small hosting provider focused on providing the best service we can to our thousands of users.
              </p>
            </div>

          {/* Services */}
          <div className="relative">
            <div className="absolute -left-4 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-secondary to-transparent opacity-60"></div>
            <h3 className="text-white font-semibold text-lg mb-4 relative">
              Services
              <div className="absolute bottom-0 left-0 w-12 h-0.5 bg-primary mt-1"></div>
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="/services/minecraft" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm flex items-center">
                  <span className="mr-2">⬛</span>
                  Minecraft
                </a>
              </li>
              <li>
                <a href="/services/discord-bots" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm flex items-center">
                  <span className="mr-2">🤖</span>
                  Discord Bots
                </a>
              </li>
              <li>
                <a href="/services" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm flex items-center">
                  <span className="mr-2">➡️</span>
                  More Services
                </a>
              </li>
            </ul>
          </div>

          {/* About */}
          <div className="relative">
            <div className="absolute -left-4 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-secondary to-transparent opacity-60"></div>
            <h3 className="text-white font-semibold text-lg mb-4 relative">
              About
              <div className="absolute bottom-0 left-0 w-12 h-0.5 bg-primary mt-1"></div>
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="/about" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm flex items-center">
                  <span className="mr-2">🏢</span>
                  About Us
                </a>
              </li>
              <li>
                <a href="/sitemap" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm flex items-center">
                  <span className="mr-2">🗺️</span>
                  Sitemap
                </a>
              </li>
              <li>
                <a href="/status" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm flex items-center">
                  <span className="mr-2">📊</span>
                  Status
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="relative">
            <div className="absolute -left-4 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-secondary to-transparent opacity-60"></div>
            <h3 className="text-white font-semibold text-lg mb-4 relative">
              Legal
              <div className="absolute bottom-0 left-0 w-12 h-0.5 bg-primary mt-1"></div>
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="/privacy" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm flex items-center">
                  <span className="mr-2">🔒</span>
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm flex items-center">
                  <span className="mr-2">⚖️</span>
                  Terms Of Service
                </a>
              </li>
              <li>
                <a href="/fair-use" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm flex items-center">
                  <span className="mr-2">⚖️</span>
                  Fair Use Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div className="relative">
            <div className="absolute -left-4 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-secondary to-transparent opacity-60"></div>
            <h3 className="text-white font-semibold text-lg mb-4 relative">
              Social
              <div className="absolute bottom-0 left-0 w-12 h-0.5 bg-primary mt-1"></div>
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="https://discord.gg/sillydev" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm flex items-center">
                  <span className="mr-2">💬</span>
                  Discord
                </a>
              </li>
              <li>
                <a href="https://github.com/Silly-Development" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm flex items-center">
                  <span className="mr-2">🐙</span>
                  GitHub
                </a>
              </li>
              <li>
                <a href="https://twitter.com/sillydevelop" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm flex items-center">
                  <span className="mr-2">🐦</span>
                  Twitter
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
        
        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-primary/30 text-center relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-60"></div>
          <p className="text-gray-400 text-sm mb-2">
            2022 - 2025 Silly Development
          </p>
          <p className="text-gray-400 text-sm">
            Made with ❤️ by Gamerz5r4
          </p>
        </div>
      </footer>
    </div>
  );
}