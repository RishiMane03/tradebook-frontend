const Loader = () => {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="flex flex-col items-center gap-3">
        {/* Logo Text */}
        <span
          className="text-4xl tracking-tight animate-pulse"
          style={{ fontFamily: "Rockybilly" }}
        >
          TradeBook
        </span>

        {/* Animated Dots */}
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
        </div>
      </div>
    </div>
  );
};

export default Loader;
