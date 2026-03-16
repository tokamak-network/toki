"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body className="bg-[#0a0a0f] min-h-screen flex items-center justify-center p-6">
        <div className="max-w-sm text-center space-y-4">
          <div className="text-4xl">!</div>
          <h2 className="text-lg font-semibold text-white">
            Something went wrong
          </h2>
          <p className="text-sm text-gray-400">
            {error.message || "An unexpected error occurred."}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={reset}
              className="px-5 py-2 rounded-lg bg-white/10 text-gray-300 text-sm font-medium hover:bg-white/15 transition-colors"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#3b82f6] to-[#22d3ee] text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Reload
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
