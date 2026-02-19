"use client";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-pink to-accent-purple flex items-center justify-center text-white font-bold text-sm">
            T
          </div>
          <span className="text-lg font-bold">
            <span className="text-gradient">Ttoni</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="hidden sm:flex items-center gap-8 text-sm text-gray-400">
          <a href="#how-it-works" className="hover:text-foreground transition-colors">
            How It Works
          </a>
          <a href="#stats" className="hover:text-foreground transition-colors">
            Stats
          </a>
          <a
            href="https://github.com/tokamak-network/ttoni"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            GitHub
          </a>
        </nav>

        {/* Connect button */}
        <button className="px-5 py-2 rounded-lg bg-gradient-to-r from-accent-pink/80 to-accent-purple/80 text-white text-sm font-medium hover:from-accent-pink hover:to-accent-purple transition-all">
          Connect
        </button>
      </div>
    </header>
  );
}
