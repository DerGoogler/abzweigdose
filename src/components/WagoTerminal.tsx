// import { Badge } from "@/components/ui/badge";
import { useState, useRef, useEffect } from "react";

interface WagoTerminalProps {
  id: string;
  position: { x: number; y: number };
  connectedWires: Array<{ id: string; label: string; color: string }>;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  isDragOver: boolean;
  onPositionChange: (id: string, position: { x: number; y: number }) => void;
  boxWidth: number;
  boxHeight: number;
}

export const WagoTerminal = ({
  id,
  position,
  connectedWires,
  onDragOver,
  onDrop,
  onDragLeave,
  isDragOver,
  onPositionChange,
  boxWidth,
  boxHeight,
}: WagoTerminalProps) => {
  const wireCount = connectedWires.length;
  // Display at least a 2-slot WAGO when there's exactly one wire connected
  const displaySlotCount = wireCount === 1 ? 2 : wireCount;
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0, wagoX: 0, wagoY: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      wagoX: position.x,
      wagoY: position.y,
    };
    e.preventDefault();
    e.stopPropagation(); // prevent parent pan start
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    // Allow pinch (2+ fingers) to bubble to container for zooming
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    const touch = e.touches[0];
    dragStartPos.current = {
      x: touch.clientX,
      y: touch.clientY,
      wagoX: position.x,
      wagoY: position.y,
    };
    e.preventDefault();
    e.stopPropagation(); // prevent parent pan start
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStartPos.current.x;
    const deltaY = e.clientY - dragStartPos.current.y;
    
    const newX = dragStartPos.current.wagoX + deltaX;
    const newY = dragStartPos.current.wagoY + deltaY;
    
    // Constrain to box boundaries (with margin to keep WAGO fully inside)
    const margin = 30; // Keep WAGO terminal away from edges
    const constrainedX = Math.max(margin, Math.min(boxWidth - margin, newX));
    const constrainedY = Math.max(margin, Math.min(boxHeight - margin, newY));
    
    onPositionChange(id, { x: constrainedX, y: constrainedY });
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStartPos.current.x;
    const deltaY = touch.clientY - dragStartPos.current.y;
    
    const newX = dragStartPos.current.wagoX + deltaX;
    const newY = dragStartPos.current.wagoY + deltaY;
    
    // Constrain to box boundaries (with margin to keep WAGO fully inside)
    const margin = 30; // Keep WAGO terminal away from edges
    const constrainedX = Math.max(margin, Math.min(boxWidth - margin, newX));
    const constrainedY = Math.max(margin, Math.min(boxHeight - margin, newY));
    
    onPositionChange(id, { x: constrainedX, y: constrainedY });
    e.preventDefault();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Add/remove mouse event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", handleTouchEnd);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [isDragging]);

  // Determine color based on wire count
  const getWagoColor = () => {
    // Use the displayed slot count so a single-wire WAGO still looks like a 2-slot block
    switch (displaySlotCount) {
      case 2:
        return "from-white to-gray-100 dark:from-gray-100 dark:to-gray-200";
      case 3:
        return "from-orange-400 to-orange-500 dark:from-orange-500 dark:to-orange-600";
      case 4:
        return "from-red-500 to-red-600 dark:from-red-600 dark:to-red-700";
      case 5:
        return "from-yellow-400 to-yellow-500 dark:from-yellow-500 dark:to-yellow-600";
      default:
        return "from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700";
    }
  };
  
  return (
    <div
      data-pan-ignore
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragLeave={onDragLeave}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className={`absolute transition-all touch-none ${
        isDragOver ? "scale-110" : ""
      } ${isDragging ? "cursor-grabbing z-50" : "cursor-grab"}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "translate(-50%, -50%)",
        zIndex: isDragging ? 50 : 30,
      }}
    >
      {/* Wago terminal block - horizontal layout like real WAGO */}
      <div
        className={`bg-gradient-to-b ${getWagoColor()} border-2 shadow-lg transition-all ${
          isDragOver
            ? "border-primary ring-4 ring-primary/50"
            : "border-slate-400 dark:border-slate-600"
        }`}
        style={{
          width: wireCount > 0 ? `${Math.max(48, displaySlotCount * 18)}px` : "48px",
          // height: "28px",
          borderRadius: "0.235rem",
          minWidth: "48px",
        }}
      >
        {/* Terminal slots - horizontal arrangement */}
        <div className="h-full flex flex-row items-center justify-center gap-0.5 px-1.5">
          {wireCount === 0 ? (
            <div className="w-1.5 h-5 bg-slate-500/30 rounded-full" />
          ) : (
            // Render slots up to displaySlotCount. For indices >= wireCount, show an empty slot placeholder.
            Array.from({ length: displaySlotCount }).map((_, index) => {
              const wire = connectedWires[index];
              const isFilled = index < wireCount && !!wire;
              return (
                <div
                  key={isFilled ? `${wire.id}-${index}` : `empty-${index}`}
                  className="h-full w-4 rounded-sm flex flex-col items-center justify-between py-0.5 relative"
                  title={isFilled ? wire.label : undefined}
                >
                  {/* Wire connection slot at bottom */}
                  <div className="w-3 h-2 bg-slate-900/60 dark:bg-black/40 rounded-sm flex items-center justify-center">
                    {isFilled ? (
                      <div className={"w-1.5 h-1.5 rounded-full " + wire.color} />
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      {/* Connection count badge */}
      {/*
      {wireCount > 0 && (
        <Badge
          variant="default"
          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {wireCount}
        </Badge>
      )}
      */}
    </div>
  );
};
