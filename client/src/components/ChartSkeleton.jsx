const ChartSkeleton = ({ height = 300 }) => {
  return (
    <div
      className="bg-gray-100 rounded-lg shadow-md border border-gray-200 animate-pulse w-full"
      style={{ height: `${height}px` }}
    >
      <div className="h-full w-full flex items-center justify-center">
        <div className="w-1/2 h-4 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
};

export default ChartSkeleton;
