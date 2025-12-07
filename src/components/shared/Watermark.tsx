import { useEffect, useState } from 'react';

export function Watermark() {
  const [colorIndex, setColorIndex] = useState(0);
  const [scale, setScale] = useState(1);

  const colors = [
    'text-yellow-400',
    'text-pink-500',
    'text-cyan-400',
    'text-lime-400',
    'text-orange-500',
    'text-purple-400',
    'text-red-500',
    'text-green-400',
  ];

  useEffect(() => {
    const colorInterval = setInterval(() => {
      setColorIndex((prev) => (prev + 1) % colors.length);
    }, 200);

    const scaleInterval = setInterval(() => {
      setScale((prev) => (prev === 1 ? 1.1 : 1));
    }, 300);

    return () => {
      clearInterval(colorInterval);
      clearInterval(scaleInterval);
    };
  }, [colors.length]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Corner watermarks */}
      <div
        className={`absolute top-4 left-4 font-black text-lg ${colors[colorIndex]} drop-shadow-lg transition-transform duration-150`}
        style={{ transform: `scale(${scale})`, textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
      >
        Made by the AI master Alex Harris
      </div>
      <div
        className={`absolute top-4 right-4 font-black text-lg ${colors[(colorIndex + 2) % colors.length]} drop-shadow-lg transition-transform duration-150`}
        style={{ transform: `scale(${scale})`, textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
      >
        Made by the AI master Alex Harris
      </div>
      <div
        className={`absolute bottom-4 left-4 font-black text-lg ${colors[(colorIndex + 4) % colors.length]} drop-shadow-lg transition-transform duration-150`}
        style={{ transform: `scale(${scale})`, textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
      >
        Made by the AI master Alex Harris
      </div>
      <div
        className={`absolute bottom-4 right-4 font-black text-lg ${colors[(colorIndex + 6) % colors.length]} drop-shadow-lg transition-transform duration-150`}
        style={{ transform: `scale(${scale})`, textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
      >
        Made by the AI master Alex Harris
      </div>

      {/* Center rotating watermark */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`font-black text-4xl md:text-6xl ${colors[colorIndex]} opacity-30 transition-transform duration-150 text-center`}
          style={{
            transform: `scale(${scale}) rotate(${colorIndex * 5}deg)`,
            textShadow: '4px 4px 8px rgba(0,0,0,0.3)',
          }}
        >
          Made by the AI master
          <br />
          ALEX HARRIS
        </div>
      </div>

      {/* Diagonal watermarks */}
      <div
        className={`absolute top-1/4 left-1/4 font-bold text-xl ${colors[(colorIndex + 1) % colors.length]} opacity-40 -rotate-12`}
        style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.4)' }}
      >
        AI MASTER
      </div>
      <div
        className={`absolute top-1/4 right-1/4 font-bold text-xl ${colors[(colorIndex + 3) % colors.length]} opacity-40 rotate-12`}
        style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.4)' }}
      >
        ALEX HARRIS
      </div>
      <div
        className={`absolute bottom-1/4 left-1/4 font-bold text-xl ${colors[(colorIndex + 5) % colors.length]} opacity-40 rotate-12`}
        style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.4)' }}
      >
        ALEX HARRIS
      </div>
      <div
        className={`absolute bottom-1/4 right-1/4 font-bold text-xl ${colors[(colorIndex + 7) % colors.length]} opacity-40 -rotate-12`}
        style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.4)' }}
      >
        AI MASTER
      </div>

      {/* Scrolling banner at bottom */}
      <div className="absolute bottom-16 left-0 right-0 overflow-hidden">
        <div
          className={`whitespace-nowrap font-black text-2xl ${colors[colorIndex]} animate-marquee`}
          style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
        >
          {Array(10)
            .fill('Made by the AI master Alex Harris')
            .join(' ★ ')}
        </div>
      </div>
    </div>
  );
}
