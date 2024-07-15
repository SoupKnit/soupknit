export function StatusBar() {
  return (
    <footer className="sticky bottom-0 z-30 ml-14 flex h-8 items-center gap-4 border-t border-gray-100 bg-white px-4 text-xs text-gray-400 shadow-md sm:py-2">
      <div className="mx-auto flex-grow text-center">
        Some info to display in the footer, stats like CPU usage, memory usage,
        etc.
      </div>
      <div className="inline-block h-3 w-3 rounded-full bg-green-300"></div>
      <div className="ml-auto">
        <span>Last run: {new Date().toLocaleTimeString()}</span>
      </div>
    </footer>
  )
}
