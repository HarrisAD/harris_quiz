export function Watermark() {
  return (
    <div className="fixed bottom-0 left-0 right-0 pointer-events-none z-50 overflow-hidden bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 py-2">
      <div
        className="whitespace-nowrap font-bold text-white text-sm animate-marquee"
        style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}
      >
        {Array(10)
          .fill('Made by the AI master Alex Harris')
          .join(' ★ ')}
      </div>
    </div>
  );
}
