export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-12 px-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-accent-pink to-accent-purple flex items-center justify-center text-white font-bold text-xs">
            T
          </div>
          <span className="text-sm text-gray-400">
            Ttoni &mdash; Built on Tokamak Network
          </span>
        </div>

        <div className="flex items-center gap-6 text-sm text-gray-500">
          <a
            href="https://tokamak.network"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-300 transition-colors"
          >
            Tokamak Network
          </a>
          <a
            href="https://github.com/tokamak-network/ttoni"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-300 transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://staking.tokamak.network"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-300 transition-colors"
          >
            Staking Dashboard
          </a>
        </div>
      </div>
    </footer>
  );
}
