import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddCableDialog } from "@/components/AddCableDialog";
import { EditCableDialog } from "@/components/EditCableDialog";
import { WagoTerminal } from "@/components/WagoTerminal";
import { toast } from "sonner";
import {
  Cable,
  Trash2,
  Plus,
  X,
  Edit2,
  Check,
  Settings2,
  Minus,
  RefreshCw,
  Download,
  Upload,
  Save,
  FolderOpen,
  Share2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useGesture } from "@use-gesture/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type WireColor = "brown" | "black" | "grey" | "blue" | "green-yellow";
type EntryPoint =
  | "top-0"
  | "top-1"
  | "top-2"
  | "right-0"
  | "right-1"
  | "right-2"
  | "bottom-0"
  | "bottom-1"
  | "bottom-2"
  | "left-0"
  | "left-1"
  | "left-2";

type BoxType = "box-75" | "box-85" | "box-44x86" | "box-100";

interface BoxConfiguration {
  id: BoxType;
  name: string;
  description: string;
  dimensions: string;
  entryPoints: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

interface Wire {
  id: string;
  color: WireColor;
  label: string;
  cableId: string;
  wagoId: string | null;
}

interface CableEntry {
  id: string;
  entryPoint: EntryPoint;
  wireCount: 3 | 5;
  crossSection: string;
  wires: Wire[];
  name?: string;
  description?: string;
}

interface WagoClamp {
  id: string;
  position: { x: number; y: number };
  connectedWireIds: string[];
}

const boxConfigurations: BoxConfiguration[] = [
  {
    id: "box-75",
    name: "75×75×40 mm",
    description: "Kleine Dose",
    dimensions: "75×75×40",
    entryPoints: { top: 2, right: 2, bottom: 2, left: 2 },
  },
  {
    id: "box-85",
    name: "85×85×40 mm",
    description: "Mittlere Dose",
    dimensions: "85×85×40",
    entryPoints: { top: 2, right: 3, bottom: 2, left: 3 },
  },
  {
    id: "box-44x86",
    name: "44×86×40 mm",
    description: "Flache Dose",
    dimensions: "44×86×40",
    entryPoints: { top: 2, right: 3, bottom: 2, left: 3 },
  },
  {
    id: "box-100",
    name: "100×100×40 mm",
    description: "Große Dose",
    dimensions: "100×100×40",
    entryPoints: { top: 3, right: 3, bottom: 3, left: 3 },
  },
];

const wireConfigs = {
  3: [
    { color: "brown" as WireColor, label: "L" },
    { color: "blue" as WireColor, label: "N" },
    { color: "green-yellow" as WireColor, label: "PE" },
  ],
  5: [
    { color: "brown" as WireColor, label: "L1" },
    { color: "black" as WireColor, label: "L2" },
    { color: "grey" as WireColor, label: "L3" },
    { color: "blue" as WireColor, label: "N" },
    { color: "green-yellow" as WireColor, label: "PE" },
  ],
};

const getWireColorClass = (color: WireColor) => {
  const colors: Record<WireColor, string> = {
    brown: "bg-[hsl(var(--wire-brown))]",
    black: "bg-[hsl(var(--wire-black))]",
    grey: "bg-[hsl(var(--wire-grey))]",
    blue: "bg-[hsl(var(--wire-blue))]",
    "green-yellow": "bg-gradient-to-r from-green-500 to-yellow-400",
  };
  return colors[color];
};

const getWireStrokeColor = (color: WireColor) => {
  const colors: Record<WireColor, string> = {
    brown: "hsl(var(--wire-brown))",
    black: "hsl(var(--wire-black))",
    grey: "hsl(var(--wire-grey))",
    blue: "hsl(var(--wire-blue))",
    "green-yellow": "green", // uses stripe pattern
  };
  return colors[color];
};

const getEntryPointLabel = (point: EntryPoint): string => {
  const [side, index] = point.split("-");
  const sideLabels: Record<string, string> = {
    top: "Oben",
    right: "Rechts",
    bottom: "Unten",
    left: "Links",
  };
  return `${sideLabels[side]} ${Number(index) + 1}`;
};

const getEntryPointPosition = (point: EntryPoint, config: BoxConfiguration) => {
  const [side, indexStr] = point.split("-");
  const index = Number(indexStr);
  const boxWidth = getBoxSize(config);
  const boxHeight = getBoxHeight(config);
  const count = config.entryPoints[side as keyof typeof config.entryPoints];

  switch (side) {
    case "top": {
      const spacing = boxWidth / (count + 1);
      const offset = spacing * (index + 1);
      return { x: offset, y: -20 };
    }
    case "right": {
      const spacing = boxHeight / (count + 1);
      const offset = spacing * (index + 1);
      return { x: boxWidth + 20, y: offset };
    }
    case "bottom": {
      const spacing = boxWidth / (count + 1);
      const offset = spacing * (index + 1);
      return { x: offset, y: boxHeight + 20 };
    }
    case "left": {
      const spacing = boxHeight / (count + 1);
      const offset = spacing * (index + 1);
      return { x: -20, y: offset };
    }
    default:
      return { x: 0, y: 0 };
  }
};

const getBoxSize = (config: BoxConfiguration): number => {
  // Map real dimensions to visual size (returns width)
  switch (config.id) {
    case "box-75":
      return 240; // Small box
    case "box-85":
      return 270; // Medium box
    case "box-44x86":
      return 140; // Same width as 85, but different height
    case "box-100":
      return 300; // Large box
    default:
      return 300;
  }
};

const getBoxHeight = (config: BoxConfiguration): number => {
  // Return height for non-square boxes
  switch (config.id) {
    case "box-44x86":
      return 270; // Flatter box (44:86 ratio ≈ 1:2)
    default:
      return getBoxSize(config); // Square boxes use same width/height
  }
};

const getBoxDepthShadow = (config: BoxConfiguration): string => {
  // Visual depth based on box size (40mm depth for all, but vary shadow intensity)
  switch (config.id) {
    case "box-75":
      return "shadow-lg"; // Lighter shadow for smaller box
    case "box-85":
      return "shadow-xl"; // Medium shadow
    case "box-100":
      return "shadow-2xl"; // Deeper shadow for larger box
    default:
      return "shadow-2xl";
  }
};

const getBoxBorderWidth = (config: BoxConfiguration): string => {
  // Proportional border width
  switch (config.id) {
    case "box-75":
      return "border-[3px]"; // Thinner border for smaller box
    case "box-85":
      return "border-[3.5px]"; // Medium border
    case "box-100":
      return "border-4"; // Thicker border for larger box
    default:
      return "border-4";
  }
};

// Small pill that scrolls text (marquee) when content exceeds width
const LabelPill: React.FC<{ text: string; className?: string }> = ({
  text,
  className,
}) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);
  const [marquee, setMarquee] = useState(false);
  const [distance, setDistance] = useState(0);

  const measure = () => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const need = inner.scrollWidth > outer.clientWidth + 2;
    setMarquee(need);
    if (need) {
      setDistance(inner.scrollWidth - outer.clientWidth + 24); // include gap
    }
  };

  // measure on mount and when text changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    measure();
  }, [text]);
  useEffect(() => {
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div
      ref={outerRef}
      className={`px-2 py-0.5 rounded-md bg-background/85 backdrop-blur border text-foreground text-[11px] md:text-xs max-w-[120px] md:max-w-[160px] shadow-sm whitespace-nowrap overflow-hidden ${
        className ?? ""
      }`}
    >
      {/* keyframes for marquee animation (scoped) */}
      <style>{`@keyframes label-marquee{0%{transform:translateX(0)}100%{transform:translateX(calc(-1 * var(--distance, 0px)))}}`}</style>
      {!marquee ? (
        <span ref={innerRef} className="inline-block align-middle">
          {text}
        </span>
      ) : (
        <div
          className="inline-flex gap-8"
          style={{
            animation: "label-marquee 8s linear infinite",
            // @ts-ignore - CSS var
            "--distance": `${distance}px`,
          }}
        >
          <span ref={innerRef} className="inline-block align-middle">
            {text}
          </span>
          <span aria-hidden className="inline-block align-middle">
            {text}
          </span>
        </div>
      )}
    </div>
  );
};

export const JunctionBox = () => {
  const [cables, setCables] = useState<CableEntry[]>([]);
  const [wagos, setWagos] = useState<WagoClamp[]>([]);
  const [draggedWire, setDraggedWire] = useState<string | null>(null);
  const [dragOverWago, setDragOverWago] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEntryPoint, setSelectedEntryPoint] =
    useState<EntryPoint | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCable, setEditingCable] = useState<CableEntry | null>(null);
  const [boxType, setBoxType] = useState<BoxType>("box-100");
  const [boxTypeDialogOpen, setBoxTypeDialogOpen] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [pendingBoxType, setPendingBoxType] = useState<BoxType | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportReadonly, setExportReadonly] = useState(false);
  const [exportFromSavedId, setExportFromSavedId] = useState<string | null>(null);
  const [isReadonly, setIsReadonly] = useState(false);
  const [configManagerOpen, setConfigManagerOpen] = useState(false);
  const [savedConfigs, setSavedConfigs] = useState<Array<{
    id: string;
    name: string;
    description?: string;
    savedAt: string;
    boxType: BoxType;
    cables: CableEntry[];
    wagos: WagoClamp[];
  }>>([]);
  const [configName, setConfigName] = useState("");
  const [configDescription, setConfigDescription] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [availableHeight, setAvailableHeight] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  // Refs hold the authoritative pan/zoom used for transform to avoid re-render on every frame
  const zoomRef = useRef<number>(1);
  const panRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const clampZoom = (z: number) => Math.min(2, Math.max(0.5, z));
  const applyTransform = (nextPan?: { x: number; y: number }, nextZoom?: number) => {
    const el = stageRef.current;
    const container = containerRef.current;
    if (!el || !container) return;

    const cfg = currentBoxConfig;
    const boxW = getBoxSize(cfg);
    const boxH = getBoxHeight(cfg);
    const STAGE_PADDING = 128;
    const stageW = boxW + STAGE_PADDING * 2;
    const stageH = boxH + STAGE_PADDING * 2;
    const availableW = containerWidth || stageW;
    const baseScale = Math.min(1, availableW / stageW);
    const z = nextZoom ?? zoomRef.current;
    const finalScale = baseScale * z;

    const rect = container.getBoundingClientRect();
    const viewportW = rect.width;
    const viewportH = Math.max(280, availableHeight);
    const stageScaledW = stageW * finalScale;
    const stageScaledH = stageH * finalScale;

    const currentPan = nextPan ?? panRef.current;
    const clamped = clampPan(
      currentPan.x,
      currentPan.y,
      viewportW,
      viewportH,
      stageScaledW,
      stageScaledH
    );

    panRef.current = clamped;
    zoomRef.current = z;
    // Apply zoom and transform directly to avoid re-render
    // Use CSS zoom instead of scale() to avoid blur
    el.style.zoom = `${finalScale}`;
    el.style.transform = `translate3d(${clamped.x}px, ${clamped.y}px, 0)`;
    el.style.willChange = "transform, zoom";
  };

  const handleZoomIn = () => {
    const z = clampZoom(zoomRef.current * 1.1);
    applyTransform(undefined, z);
    setZoom(z);
  };
  const handleZoomOut = () => {
    const z = clampZoom(zoomRef.current / 1.1);
    applyTransform(undefined, z);
    setZoom(z);
  };
  const handleZoomReset = () => {
    applyTransform(undefined, 1);
    setZoom(1);
  };

  // Center/focus content within current viewport
  const handleCenter = () => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const boxW = getBoxSize(currentBoxConfig);
    const boxH = getBoxHeight(currentBoxConfig);
    const STAGE_PADDING = 128;
    const stageW = boxW + STAGE_PADDING * 2;
    const stageH = boxH + STAGE_PADDING * 2;
    const availableW = containerWidth || stageW;
    const baseScale = Math.min(1, availableW / stageW);
    const finalScale = baseScale * (zoomRef.current);
    const viewportW = rect.width;
    const viewportH = Math.max(280, availableHeight);
    const stageScaledW = stageW * finalScale;
    const stageScaledH = stageH * finalScale;
    const targetX = (viewportW - stageScaledW) / 2;
    const targetY = (viewportH - stageScaledH) / 2;
    const centered = clampPan(
      targetX,
      targetY,
      viewportW,
      viewportH,
      stageScaledW,
      stageScaledH
    );
    applyTransform(centered, zoomRef.current);
    setPan(centered);
  };

  // Load saved configs from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("abzweigdose-configs");
      if (saved) {
        setSavedConfigs(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Error loading saved configs:", error);
    }
  }, []);

  // Measure container width for responsive scaling
  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return;
      setContainerWidth(containerRef.current.getBoundingClientRect().width);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Track mobile breakpoint and compute available viewport height for the stage (mobile full-screen usage)
  useEffect(() => {
    const update = () => {
      const viewportH = window.visualViewport?.height ?? window.innerHeight;
      setIsMobile(window.innerWidth < 1024); // match lg breakpoint
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Fill from the container top to the bottom of the visual viewport
        const avail = Math.max(240, Math.floor(viewportH - rect.top));
        setAvailableHeight(avail);
      } else {
        setAvailableHeight(viewportH);
      }
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, { passive: true } as any);
    window.visualViewport?.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update as any);
      window.visualViewport?.removeEventListener("resize", update as any);
    };
  }, []);

  // Helpers to clamp pan so the stage never escapes the card
  const clampPan = (
    px: number,
    py: number,
    viewportW: number,
    viewportH: number,
    stageScaledW: number,
    stageScaledH: number
  ) => {
    // If content smaller than viewport, center it
    const centerX =
      stageScaledW < viewportW ? (viewportW - stageScaledW) / 2 : undefined;
    const centerY =
      stageScaledH < viewportH ? (viewportH - stageScaledH) / 2 : undefined;
    if (centerX !== undefined) px = centerX;
    else px = Math.min(0, Math.max(viewportW - stageScaledW, px));
    if (centerY !== undefined) py = centerY;
    else py = Math.min(0, Math.max(viewportH - stageScaledH, py));
    return { x: px, y: py };
  };

  // Trackpad pinch (Ctrl+wheel) zoom around pointer (throttled + debounced)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return; // only intercept pinch zoom
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * 0.0015);
      const newZoom = clampZoom(zoomRef.current * factor);

      // Compute scales and clamp pan to keep pointer stable
      const rect = el.getBoundingClientRect();
      const pointerX = e.clientX - rect.left;
      const pointerY = e.clientY - rect.top;

      const boxW = getBoxSize(currentBoxConfig);
      const boxH = getBoxHeight(currentBoxConfig);
      const STAGE_PADDING = 128;
      const stageW = boxW + STAGE_PADDING * 2;
      const stageH = boxH + STAGE_PADDING * 2;
      const availableW = containerWidth || stageW;
      const baseScale = Math.min(1, availableW / stageW);
      const oldScale = baseScale * zoomRef.current;
      const newScale = baseScale * newZoom;

      let nextPanX =
        pointerX - (pointerX - panRef.current.x) * (newScale / oldScale);
      let nextPanY =
        pointerY - (pointerY - panRef.current.y) * (newScale / oldScale);

      const viewportW = rect.width;
      const viewportH = Math.max(280, availableHeight);
      const stageScaledW = stageW * newScale;
      const stageScaledH = stageH * newScale;
      const clamped = clampPan(
        nextPanX,
        nextPanY,
        viewportW,
        viewportH,
        stageScaledW,
        stageScaledH
      );

      // Throttle DOM updates to animation frames
      if (wheelRafRef.current) cancelAnimationFrame(wheelRafRef.current);
      wheelRafRef.current = requestAnimationFrame(() => {
        applyTransform(clamped, newZoom);
      });
      // Debounce committing to React state to avoid re-render thrash
      if (wheelCommitTimerRef.current) {
        window.clearTimeout(wheelCommitTimerRef.current);
      }
      wheelCommitTimerRef.current = window.setTimeout(() => {
        setPan(panRef.current);
        setZoom(zoomRef.current);
        wheelCommitTimerRef.current = null;
      }, 120);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      if (wheelRafRef.current) cancelAnimationFrame(wheelRafRef.current);
      if (wheelCommitTimerRef.current)
        window.clearTimeout(wheelCommitTimerRef.current);
    };
  }, [boxType, containerWidth, availableHeight]);

  // Pinch zoom and pan gestures using @use-gesture/react (optimized for performance)
  const rafRef = useRef<number>();
  const wheelRafRef = useRef<number>();
  const wheelCommitTimerRef = useRef<number | null>(null);
  useGesture(
    {
      onPinch: ({ offset: [scale], origin: [ox, oy], memo, event, last }) => {
        event?.preventDefault();

        const el = containerRef.current;
        if (!el) return memo;

        // Initialize memo with starting values
        if (!memo) {
          memo = {
            startZoom: zoomRef.current,
            startPan: { ...panRef.current },
            rect: el.getBoundingClientRect(),
            cfg:
              boxConfigurations.find((c) => c.id === boxType) ||
              boxConfigurations[0],
            hasZoomed: false,
          };
        }

        // Only apply zoom if scale has changed meaningfully (> 1% difference)
        const scaleChange = Math.abs(scale - 1);
        if (scaleChange < 0.01 && !memo.hasZoomed) {
          return memo;
        }

        memo.hasZoomed = true;

        // Cancel pending RAF to avoid batching too many updates
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }

        const updateTransform = () => {
          const newZoom = clampZoom(memo.startZoom * scale);
          const rect = memo.rect;
          const pointerX = ox - rect.left;
          const pointerY = oy - rect.top;

          const boxW = getBoxSize(memo.cfg);
          const boxH = getBoxHeight(memo.cfg);
          const STAGE_PADDING = 128;
          const stageW = boxW + STAGE_PADDING * 2;
          const stageH = boxH + STAGE_PADDING * 2;
          const availableW = containerWidth || stageW;
          const baseScale = Math.min(1, availableW / stageW);
          const oldScale = baseScale * memo.startZoom;
          const newScale = baseScale * newZoom;

          let nextPanX =
            pointerX - (pointerX - memo.startPan.x) * (newScale / oldScale);
          let nextPanY =
            pointerY - (pointerY - memo.startPan.y) * (newScale / oldScale);

          const viewportW = rect.width;
          const viewportH = rect.height;
          const stageScaledW = stageW * newScale;
          const stageScaledH = stageH * newScale;
          const clamped = clampPan(
            nextPanX,
            nextPanY,
            viewportW,
            viewportH,
            stageScaledW,
            stageScaledH
          );
          // Apply directly without triggering re-render each frame
          applyTransform(clamped, newZoom);
          // Defer state sync for end of gesture (last)
        };

        // Use RAF for smooth 60fps updates, or update immediately on last event
        if (last) {
          updateTransform();
          // Sync final values to state
          setPan(panRef.current);
          setZoom(zoomRef.current);
        } else {
          rafRef.current = requestAnimationFrame(updateTransform);
        }

        return memo;
      },
    },
    {
      target: containerRef,
      eventOptions: { passive: false },
      pinch: {
        scaleBounds: { min: 0.5, max: 2 },
        rubberband: true,
      },
    }
  );

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const currentBoxConfig =
    boxConfigurations.find((c) => c.id === boxType) || boxConfigurations[0];

  // Keep DOM transform in sync when external factors change
  useEffect(() => {
    // Sync refs to state for external updates (e.g., center, buttons, load/import)
    zoomRef.current = zoom;
    panRef.current = pan;
    // Apply once dimensions are known
    applyTransform(pan, zoom);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, pan, containerWidth, availableHeight, boxType]);

  // Reusable content for the cable list (used in desktop card and mobile drawer)
  const renderCableList = () => (
    <>
      <h2 className="text-lg font-semibold mb-4">Leitungen & Verbindungen</h2>
      {cables.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Cable className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Noch keine Leitungen</p>
          <p className="text-xs mt-1">Klicken Sie auf eine Öffnung</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cables.map((cable) => (
            <Card key={cable.id} className="p-4 space-y-3 bg-secondary/50">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      {cable.name && (
                        <div className="font-semibold text-sm truncate">
                          {cable.name}
                        </div>
                      )}
                      {cable.description && (
                        <div className="text-xs text-muted-foreground italic truncate mb-1">
                          {cable.description}
                        </div>
                      )}
                      <div
                        className={`text-sm ${
                          cable.name ? "text-muted-foreground" : "font-medium"
                        }`}
                      >
                        {getEntryPointLabel(cable.entryPoint)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {cable.wireCount}-adrig • {cable.crossSection}mm²
                      </div>
                    </div>
                    {!isReadonly && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => startEditingCable(cable)}
                        className="h-7 w-7 flex-shrink-0"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                {!isReadonly && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleRemoveCable(cable.id)}
                    className="h-8 w-8 flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {cable.wires.map((wire) => {
                  const wagoInfo = wire.wagoId
                    ? (() => {
                        const wago = wagos.find((w) => w.id === wire.wagoId);
                        const connectedWires = getWagoWires(wire.wagoId);
                        return { wago, connectedWires };
                      })()
                    : null;

                  return (
                    <div key={wire.id} className="w-full space-y-1">
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-background">
                        <div
                          className={`w-5 h-5 rounded-full ${getWireColorClass(
                            wire.color
                          )} shadow-md flex-shrink-0`}
                        />
                        <Badge variant="outline" className="text-xs">
                          {wire.label}
                        </Badge>
                        {wire.wagoId ? (
                          <div className="flex items-center gap-1 ml-auto">
                            <Badge variant="default" className="text-xs">
                              Wago
                            </Badge>
                            {!isReadonly && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleRemoveWireFromWago(wire.id)}
                                className="h-5 w-5"
                                title="Von Wago trennen"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ) : null}
                      </div>
                      {wagoInfo && wagoInfo.connectedWires.length > 1 && (
                        <div className="pl-7 text-xs text-muted-foreground">
                          ↔{" "}
                          {wagoInfo.connectedWires
                            .filter((w) => w.id !== wire.id)
                            .map((w) => `${w.cableLabel} ${w.label}`)
                            .join(", ")}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}

      {!isReadonly && (
        <div className="mt-4 flex gap-2">
          <Button onClick={handleAddWago} className="flex-1 touch-manipulation">
            <Plus className="w-4 h-4 mr-2" /> Wago-Klemme
          </Button>
          <Button
            onClick={() => setBoxTypeDialogOpen(true)}
            variant="outline"
            className="flex-1 touch-manipulation"
          >
            <Settings2 className="w-4 h-4 mr-2" /> Dosentyp
          </Button>
        </div>
      )}
    </>
  );

  const generateEntryPoints = (config: BoxConfiguration): EntryPoint[] => {
    const points: EntryPoint[] = [];
    (["top", "right", "bottom", "left"] as const).forEach((side) => {
      const count = config.entryPoints[side];
      for (let i = 0; i < count; i++) {
        points.push(`${side}-${i}` as EntryPoint);
      }
    });
    return points;
  };

  const entryPoints = generateEntryPoints(currentBoxConfig);

  const handleEntryPointClick = (point: EntryPoint) => {
    if (isReadonly) {
      toast.info("Schreibgeschützte Konfiguration - keine Änderungen möglich");
      return;
    }
    const existingCable = cables.find((c) => c.entryPoint === point);
    if (existingCable) {
      toast.info("An dieser Öffnung ist bereits eine Leitung angeschlossen");
      return;
    }
    setSelectedEntryPoint(point);
    setDialogOpen(true);
  };

  const handleChangeBoxType = (newType: BoxType) => {
    if (newType === boxType) {
      setBoxTypeDialogOpen(false);
      return;
    }
    setPendingBoxType(newType);
    setConfirmResetOpen(true);
  };

  const confirmApplyBoxType = () => {
    if (!pendingBoxType) return;
    const newConfig = boxConfigurations.find((c) => c.id === pendingBoxType);
    // Reset all user-placed data when changing box type
    setCables([]);
    setWagos([]);
    setBoxType(pendingBoxType);
    setPendingBoxType(null);
    setConfirmResetOpen(false);
    setBoxTypeDialogOpen(false);
    if (newConfig) {
      toast.success(`Dosentyp geändert zu: ${newConfig.name}`);
    } else {
      toast.success(`Dosentyp geändert`);
    }
  };

  const handleAddCable = (
    wireCount: 3 | 5,
    crossSection: string,
    name: string,
    description: string
  ) => {
    if (!selectedEntryPoint) return;

    const cableId = `cable-${Date.now()}`;
    const config = wireConfigs[wireCount];
    const wires: Wire[] = config.map((wireConfig, index) => ({
      id: `${cableId}-wire-${index}`,
      color: wireConfig.color,
      label: wireConfig.label,
      cableId,
      wagoId: null,
    }));

    const newCable: CableEntry = {
      id: cableId,
      entryPoint: selectedEntryPoint,
      wireCount,
      crossSection,
      wires,
      name: name || undefined,
      description: description || undefined,
    };

    setCables((prev) => [...prev, newCable]);
    const displayName = name ? `"${name}"` : `${wireCount}-adrige Leitung`;
    toast.success(`${displayName} (${crossSection}mm²) hinzugefügt`);
  };

  const handleAddWago = () => {
    if (isReadonly) {
      toast.info("Schreibgeschützte Konfiguration - keine Änderungen möglich");
      return;
    }
    const boxWidth = getBoxSize(currentBoxConfig);
    const boxHeight = getBoxHeight(currentBoxConfig);
    const newWago: WagoClamp = {
      id: `wago-${Date.now()}`,
      position: { x: boxWidth / 2, y: boxHeight / 2 },
      connectedWireIds: [],
    };
    setWagos((prev) => [...prev, newWago]);
    toast.success("Wago-Klemme hinzugefügt");
  };

  const handleDragStart = (wireId: string) => {
    setDraggedWire(wireId);
    const wire = cables.flatMap((c) => c.wires).find((w) => w.id === wireId);
    toast.info(`${wire?.label} - ziehen Sie auf eine Wago-Klemme`);
  };

  const handleWagoDragOver = (e: React.DragEvent, wagoId: string) => {
    e.preventDefault();
    if (draggedWire) {
      setDragOverWago(wagoId);
    }
  };

  const handleWagoDragLeave = () => {
    setDragOverWago(null);
  };

  const handleWagoDrop = (e: React.DragEvent, wagoId: string) => {
    e.preventDefault();

    if (!draggedWire) {
      setDragOverWago(null);
      return;
    }

    const wire = cables
      .flatMap((c) => c.wires)
      .find((w) => w.id === draggedWire);
    if (!wire) return;

    // Enforce max 5 wires per WAGO
    const targetWago = wagos.find((w) => w.id === wagoId);
    if (
      targetWago &&
      targetWago.connectedWireIds.length >= 5 &&
      !targetWago.connectedWireIds.includes(draggedWire)
    ) {
      toast.error("Maximal 5 Adern pro Wago-Klemme erlaubt");
      setDraggedWire(null);
      setDragOverWago(null);
      return;
    }

    // If wire already in another wago, remove from it
    if (wire.wagoId) {
      setWagos((prev) =>
        prev.map((w) =>
          w.id === wire.wagoId
            ? {
                ...w,
                connectedWireIds: w.connectedWireIds.filter(
                  (id) => id !== draggedWire
                ),
              }
            : w
        )
      );
    }

    // Add to new wago
    setWagos((prev) =>
      prev.map((w) =>
        w.id === wagoId
          ? { ...w, connectedWireIds: [...w.connectedWireIds, draggedWire] }
          : w
      )
    );

    // Update wire reference
    setCables((prev) =>
      prev.map((cable) => ({
        ...cable,
        wires: cable.wires.map((w) =>
          w.id === draggedWire ? { ...w, wagoId } : w
        ),
      }))
    );

    toast.success(`${wire.label} mit Wago-Klemme verbunden`);
    setDraggedWire(null);
    setDragOverWago(null);
  };

  const handleRemoveCable = (cableId: string) => {
    const cable = cables.find((c) => c.id === cableId);
    if (cable) {
      const wireIds = cable.wires.map((w) => w.id);
      setWagos((prev) =>
        prev.map((w) => ({
          ...w,
          connectedWireIds: w.connectedWireIds.filter(
            (id) => !wireIds.includes(id)
          ),
        }))
      );
    }
    setCables((prev) => prev.filter((c) => c.id !== cableId));
    toast.success("Leitung entfernt");
  };

  const handleRemoveWago = (wagoId: string) => {
    setCables((prev) =>
      prev.map((cable) => ({
        ...cable,
        wires: cable.wires.map((w) =>
          w.wagoId === wagoId ? { ...w, wagoId: null } : w
        ),
      }))
    );
    setWagos((prev) => prev.filter((w) => w.id !== wagoId));
    toast.success("Wago-Klemme entfernt");
  };

  const handleWagoPositionChange = (
    wagoId: string,
    position: { x: number; y: number }
  ) => {
    setWagos((prev) =>
      prev.map((w) => (w.id === wagoId ? { ...w, position } : w))
    );
  };

  const handleRemoveWireFromWago = (wireId: string) => {
    const wire = cables.flatMap((c) => c.wires).find((w) => w.id === wireId);
    if (!wire || !wire.wagoId) return;

    // Remove wire from wago
    setWagos((prev) =>
      prev.map((w) =>
        w.id === wire.wagoId
          ? {
              ...w,
              connectedWireIds: w.connectedWireIds.filter(
                (id) => id !== wireId
              ),
            }
          : w
      )
    );

    // Update wire reference
    setCables((prev) =>
      prev.map((cable) => ({
        ...cable,
        wires: cable.wires.map((w) =>
          w.id === wireId ? { ...w, wagoId: null } : w
        ),
      }))
    );

    toast.success(`${wire.label} von Wago-Klemme entfernt`);
  };

  const handleUpdateCable = (
    wireCount: 3 | 5,
    crossSection: string,
    name: string,
    description: string
  ) => {
    if (!editingCable) return;

    const oldWireCount = editingCable.wireCount;
    const newWireCount = wireCount;

    // If wire count changed, we need to recreate wires
    if (oldWireCount !== newWireCount) {
      const config = wireConfigs[newWireCount];
      const newWires: Wire[] = config.map((wireConfig, index) => ({
        id: `${editingCable.id}-wire-${index}`,
        color: wireConfig.color,
        label: wireConfig.label,
        cableId: editingCable.id,
        wagoId: null, // Disconnect all wires when changing wire count
      }));

      // Remove old wires from wagos
      const oldWireIds = editingCable.wires.map((w) => w.id);
      setWagos((prev) =>
        prev.map((w) => ({
          ...w,
          connectedWireIds: w.connectedWireIds.filter(
            (id) => !oldWireIds.includes(id)
          ),
        }))
      );

      setCables((prev) =>
        prev.map((cable) =>
          cable.id === editingCable.id
            ? {
                ...cable,
                wireCount: newWireCount,
                crossSection,
                name: name || undefined,
                description: description || undefined,
                wires: newWires,
              }
            : cable
        )
      );

      toast.warning("Aderzahl geändert - alle Verbindungen wurden getrennt");
    } else {
      // Just update metadata
      setCables((prev) =>
        prev.map((cable) =>
          cable.id === editingCable.id
            ? {
                ...cable,
                crossSection,
                name: name || undefined,
                description: description || undefined,
              }
            : cable
        )
      );
      toast.success("Leitung aktualisiert");
    }

    setEditDialogOpen(false);
    setEditingCable(null);
  };

  const startEditingCable = (cable: CableEntry) => {
    setEditingCable(cable);
    setEditDialogOpen(true);
  };

  // Open export dialog
  const handleExportClick = () => {
    setExportFromSavedId(null);
    setExportDialogOpen(true);
  };

  // Export configuration to JSON
  const handleExport = () => {
    // Decide data source: current or saved
    let data: { boxType: BoxType; cables: CableEntry[]; wagos: WagoClamp[] } | null = null;
    let fileBase = `abzweigdose`;
    if (exportFromSavedId) {
      const cfg = savedConfigs.find((c) => c.id === exportFromSavedId);
      if (!cfg) {
        toast.error("Gespeicherte Konfiguration nicht gefunden");
        setExportDialogOpen(false);
        setExportFromSavedId(null);
        setExportReadonly(false);
        return;
      }
      data = { boxType: cfg.boxType, cables: cfg.cables, wagos: cfg.wagos };
      fileBase = cfg.name ? cfg.name.replace(/[^a-z0-9]/gi, '-').toLowerCase() : fileBase;
    } else {
      data = { boxType, cables, wagos };
    }

    const config = {
      version: "1.0",
      boxType: data.boxType,
      cables: data.cables,
      wagos: data.wagos,
      readonly: exportReadonly,
      exportDate: new Date().toISOString(),
    };

    const json = JSON.stringify(config, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileBase}-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Konfiguration exportiert");
    setExportDialogOpen(false);
    setExportFromSavedId(null);
    setExportReadonly(false); // Reset for next export
  };

  // Import configuration from JSON
  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = event.target?.result as string;
          const config = JSON.parse(json);

          // Validate the configuration
          if (!config.version || !config.boxType || !config.cables || !config.wagos) {
            toast.error("Ungültiges Dateiformat");
            return;
          }

          // Check if configuration is readonly
          if (config.readonly) {
            setIsReadonly(true);
            toast.info("Schreibgeschützte Konfiguration geladen");
          } else {
            setIsReadonly(false);
          }

          // Apply the configuration
          setBoxType(config.boxType);
          setCables(config.cables);
          setWagos(config.wagos);
          toast.success("Konfiguration importiert");
        } catch (error) {
          toast.error("Fehler beim Importieren der Datei");
          console.error(error);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Save current configuration to localStorage
  const handleSaveConfig = () => {
    if (isReadonly) {
      toast.error("Schreibgeschützte Konfiguration kann nicht gespeichert werden");
      return;
    }
    
    if (!configName.trim()) {
      toast.error("Bitte geben Sie einen Namen ein");
      return;
    }

    const newConfig = {
      id: `config-${Date.now()}`,
      name: configName.trim(),
      description: configDescription.trim() || undefined,
      savedAt: new Date().toISOString(),
      boxType,
      cables,
      wagos,
    };

    const updatedConfigs = [...savedConfigs, newConfig];
    setSavedConfigs(updatedConfigs);
    localStorage.setItem("abzweigdose-configs", JSON.stringify(updatedConfigs));
    
    toast.success(`"${newConfig.name}" gespeichert`);
    setConfigName("");
    setConfigDescription("");
    setConfigManagerOpen(false);
  };

  // Load a saved configuration
  const handleLoadConfig = (configId: string) => {
    const config = savedConfigs.find((c) => c.id === configId);
    if (!config) return;

    setBoxType(config.boxType);
    setCables(config.cables);
    setWagos(config.wagos);
    setIsReadonly(false); // Loaded configs from localStorage are always editable
    toast.success(`"${config.name}" geladen`);
    setConfigManagerOpen(false);
  };

  // Delete a saved configuration
  const handleDeleteConfig = (configId: string) => {
    const config = savedConfigs.find((c) => c.id === configId);
    const updatedConfigs = savedConfigs.filter((c) => c.id !== configId);
    setSavedConfigs(updatedConfigs);
    localStorage.setItem("abzweigdose-configs", JSON.stringify(updatedConfigs));
    toast.success(`"${config?.name}" gelöscht`);
  };

  // Share a saved configuration using the same export dialog
  const handleExportSavedConfig = (configId: string) => {
    const cfg = savedConfigs.find((c) => c.id === configId);
    if (!cfg) return;
    setExportFromSavedId(configId);
    setExportReadonly(false);
    setExportDialogOpen(true);
  };

  const getWirePosition = (wire: Wire) => {
    const cable = cables.find((c) => c.id === wire.cableId);
    if (!cable) return { x: 150, y: 150 };

    const wireIndex = cable.wires.findIndex((w) => w.id === wire.id);
    const totalWires = cable.wires.length;

    const [side, indexStr] = cable.entryPoint.split("-");
    const entryIndex = Number(indexStr);

    const boxWidth = getBoxSize(currentBoxConfig);
    const boxHeight = getBoxHeight(currentBoxConfig);
    const count =
      currentBoxConfig.entryPoints[
        side as keyof typeof currentBoxConfig.entryPoints
      ];

    const wireSpacing = 8; // spread wires next to each other at entry
    const wireOffset = (wireIndex - (totalWires - 1) / 2) * wireSpacing;
    const edgeDistance = 0;

    switch (side) {
      case "top": {
        const spacing = boxWidth / (count + 1);
        const baseOffset = spacing * (entryIndex + 1);
        return { x: baseOffset + wireOffset, y: edgeDistance };
      }
      case "right": {
        const spacing = boxHeight / (count + 1);
        const baseOffset = spacing * (entryIndex + 1);
        return { x: boxWidth - edgeDistance, y: baseOffset + wireOffset };
      }
      case "bottom": {
        const spacing = boxWidth / (count + 1);
        const baseOffset = spacing * (entryIndex + 1);
        return { x: baseOffset + wireOffset, y: boxHeight - edgeDistance };
      }
      case "left": {
        const spacing = boxHeight / (count + 1);
        const baseOffset = spacing * (entryIndex + 1);
        return { x: edgeDistance, y: baseOffset + wireOffset };
      }
      default:
        return { x: 150, y: 150 };
    }
  };

  const getWagoWires = (wagoId: string) => {
    const wago = wagos.find((w) => w.id === wagoId);
    if (!wago) return [];
    
    // Define the standard wire color order
    const wireColorOrder: WireColor[] = ["brown", "black", "grey", "blue", "green-yellow"];
    
    const wires = wago.connectedWireIds
      .map((wireId) => {
        const wire = cables
          .flatMap((c) => c.wires)
          .find((w) => w.id === wireId);
        const cable = cables.find((c) => c.id === wire?.cableId);
        return wire && cable
          ? { ...wire, cableLabel: getEntryPointLabel(cable.entryPoint) }
          : null;
      })
      .filter(Boolean) as Array<Wire & { cableLabel: string }>;
    
    // Sort wires by their color order to maintain proper port arrangement
    return wires.sort((a, b) => {
      const aIndex = wireColorOrder.indexOf(a.color);
      const bIndex = wireColorOrder.indexOf(b.color);
      return aIndex - bIndex;
    });
  };

  // Calculate orthogonal (right-angled) path between wire and wago
  const calculateOrthogonalPath = (
    wirePos: { x: number; y: number },
    wagoPos: { x: number; y: number },
    wireId: string,
    wireColor: WireColor
  ): string => {
    const wire = cables.flatMap((c) => c.wires).find((w) => w.id === wireId);
    if (!wire) return `M ${wirePos.x} ${wirePos.y} L ${wagoPos.x} ${wagoPos.y}`;

    const cable = cables.find((c) => c.id === wire.cableId);
    if (!cable)
      return `M ${wirePos.x} ${wirePos.y} L ${wagoPos.x} ${wagoPos.y}`;

    const [side] = cable.entryPoint.split("-");

    const wago = wagos.find((w) => w.id === wire.wagoId);
    if (!wago) return `M ${wirePos.x} ${wirePos.y} L ${wagoPos.x} ${wagoPos.y}`;

    const wiresInThisWago = cables
      .flatMap((c) => c.wires)
      .filter((w) => w.wagoId === wire.wagoId);
    const idxInWago = wiresInThisWago.findIndex((w) => w.id === wireId);
    const slotWidth = 18; // match visual WAGO layout
    const wagoConnectionOffset =
      (idxInWago - (wiresInThisWago.length - 1) / 2) * slotWidth;
    const wagoConnectionPoint = {
      x: wagoPos.x + wagoConnectionOffset,
      y: wagoPos.y,
    };

    // Allocate unique lanes per entry side so only one wire runs on a trunk
    const connectedBySide = cables
      .flatMap((c) => c.wires)
      .filter((w) => w.wagoId !== null)
      .filter((w) => {
        const c = cables.find((cc) => cc.id === w.cableId);
        if (!c) return false;
        return c.entryPoint.split("-")[0] === side;
      });

    const getTargetCoord = (w: Wire) => {
      const wg = wagos.find((x) => x.id === w.wagoId);
      if (!wg) return 0;
      const inW = cables
        .flatMap((c) => c.wires)
        .filter((x) => x.wagoId === w.wagoId);
      const i = inW.findIndex((x) => x.id === w.id);
      const off = (i - (inW.length - 1) / 2) * slotWidth;
      return side === "top" || side === "bottom"
        ? wg.position.x + off
        : wg.position.y;
    };

    const sideGroupSorted = connectedBySide.sort(
      (a, b) => getTargetCoord(a) - getTargetCoord(b)
    );
    const laneIndex = sideGroupSorted.findIndex((w) => w.id === wireId);
    const laneSpacing = 12;

    let path = `M ${wirePos.x} ${wirePos.y}`;

    if (side === "top" || side === "bottom") {
      const direction = side === "top" ? 1 : -1;
      const firstTurn = wirePos.y + direction * (20 + laneIndex * laneSpacing);
      path += ` L ${wirePos.x} ${firstTurn}`;
      path += ` L ${wagoConnectionPoint.x} ${firstTurn}`;
      path += ` L ${wagoConnectionPoint.x} ${wagoConnectionPoint.y}`;
    } else {
      const direction = side === "left" ? 1 : -1;
      const firstTurn = wirePos.x + direction * (20 + laneIndex * laneSpacing);
      path += ` L ${firstTurn} ${wirePos.y}`;
      path += ` L ${firstTurn} ${wagoConnectionPoint.y}`;
      path += ` L ${wagoConnectionPoint.x} ${wagoConnectionPoint.y}`;
    }

    return path;
  };

  return (
    <div className="h-screen bg-background p-0 overflow-hidden">
      <div className="h-full max-w-6xl mx-auto">
        {/* Top app bar (unified for mobile & desktop) */}
        <div
          className="sticky top-0 z-40 bg-background/90 backdrop-blur border-b"
          data-pan-ignore
        >
          <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto">
            <div className="font-semibold whitespace-nowrap flex-shrink-0">
              Abzweigdose
              {isReadonly && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  Schreibgeschützt
                </Badge>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="touch-manipulation whitespace-nowrap"
                onClick={() => setMobileDrawerOpen(true)}
              >
                Leitungen
              </Button>
              <Button
                size="sm"
                className="touch-manipulation whitespace-nowrap"
                onClick={handleAddWago}
                disabled={isReadonly}
              >
                <Plus className="w-4 h-4 mr-2" /> Wago
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="touch-manipulation whitespace-nowrap"
                onClick={() => setBoxTypeDialogOpen(true)}
                disabled={isReadonly}
              >
                Dosentyp
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="touch-manipulation"
                onClick={handleExportClick}
                title="Exportieren"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="touch-manipulation"
                onClick={handleImport}
                title="Importieren"
              >
                <Upload className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="touch-manipulation"
                onClick={() => setConfigManagerOpen(true)}
                title="Konfigurationen verwalten"
              >
                <FolderOpen className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Junction box */}
        <div className="relative overflow-visible h-[calc(100vh-49px)] bg-transparent">
          {/* Responsive scaler wrapper */}
          <div
              ref={containerRef}
              className={`relative w-full overflow-hidden ${
                isPanning ? "cursor-grabbing" : "cursor-grab"
              }`}
              style={{ touchAction: "none" }}
              onPointerDown={(e) => {
                // Avoid starting pan on interactive controls or draggables
                let el = e.target as HTMLElement | null;
                const root = containerRef.current;
                let interactive = false;
                while (el && el !== root) {
                  const tag = el.tagName.toLowerCase();
                  if (
                    el.hasAttribute("data-pan-ignore") ||
                    el.getAttribute("draggable") === "true" ||
                    tag === "button" ||
                    tag === "input" ||
                    tag === "textarea" ||
                    el.getAttribute("role") === "button"
                  ) {
                    interactive = true;
                    break;
                  }
                  el = el.parentElement;
                }
                if (interactive) return;
                setIsPanning(true);
                lastPointRef.current = { x: e.clientX, y: e.clientY };
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (!isPanning || !lastPointRef.current) return;
                const dx = e.clientX - lastPointRef.current.x;
                const dy = e.clientY - lastPointRef.current.y;
                lastPointRef.current = { x: e.clientX, y: e.clientY };

                const boxW = getBoxSize(currentBoxConfig);
                const boxH = getBoxHeight(currentBoxConfig);
                const STAGE_PADDING = 128;
                const stageW = boxW + STAGE_PADDING * 2;
                const stageH = boxH + STAGE_PADDING * 2;
                const availableW = containerWidth || stageW;
                const baseScale = Math.min(1, availableW / stageW);
                const finalScale = baseScale * zoom;

                const rect = (
                  e.currentTarget as HTMLElement
                ).getBoundingClientRect();
                const viewportW = rect.width;
                const viewportH = rect.height;
                const stageScaledW = stageW * finalScale;
                const stageScaledH = stageH * finalScale;

                const next = clampPan(
                  panRef.current.x + dx,
                  panRef.current.y + dy,
                  viewportW,
                  viewportH,
                  stageScaledW,
                  stageScaledH
                );
                applyTransform(next, zoomRef.current);
              }}
              onPointerUp={(e) => {
                setIsPanning(false);
                lastPointRef.current = null;
                try {
                  (e.currentTarget as HTMLElement).releasePointerCapture(
                    e.pointerId
                  );
                } catch {}
                // Commit panning to state once interaction ends
                setPan(panRef.current);
              }}
              onPointerCancel={() => {
                setIsPanning(false);
                lastPointRef.current = null;
              }}
            >
              {(() => {
                const boxW = getBoxSize(currentBoxConfig);
                const boxH = getBoxHeight(currentBoxConfig);
                // Reserve space for entry dots + label pills (max 120px on mobile)
                const STAGE_PADDING = 128;
                const stageW = boxW + STAGE_PADDING * 2;
                const stageH = boxH + STAGE_PADDING * 2;
                const availableW = containerWidth || stageW;
                const baseScale = Math.min(1, availableW / stageW);
                const finalScale = baseScale * zoomRef.current;
                // Viewport height: use all remaining screen height (unified for all screens)
                const viewportH = Math.max(280, availableHeight);
                // Center pan when content fits
                return (
                  <div style={{ height: `${viewportH}px` }}>
                    <div
                      ref={stageRef}
                      className="relative"
                      style={{
                        width: `${stageW}px`,
                        height: `${stageH}px`,
                        // transform is applied imperatively in applyTransform() for performance
                        position: "relative",
                        willChange: "transform",
                      }}
                    >
                      {/* Main junction box */}
                      <div
                        ref={boxRef}
                        className={`absolute bg-gradient-to-br from-card to-secondary ${getBoxBorderWidth(
                          currentBoxConfig
                        )} border-primary/30 rounded-xl overflow-visible transition-all duration-300 ${getBoxDepthShadow(
                          currentBoxConfig
                        )}`}
                        style={{
                          left: `${STAGE_PADDING}px`,
                          top: `${STAGE_PADDING}px`,
                          width: `${boxW}px`,
                          height: `${boxH}px`,
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />

                        {/* Size label on box */}
                        <div className="absolute top-2 left-2 right-2 flex justify-center pointer-events-none">
                          <Badge
                            variant="secondary"
                            className="text-xs opacity-60"
                          >
                            {currentBoxConfig.dimensions} mm
                          </Badge>
                        </div>

                        {/* Connection lines */}
                        <svg
                          className="absolute inset-0 w-full h-full pointer-events-none"
                          style={{ zIndex: 1 }}
                        >
                          <defs>
                            <pattern
                              id="pe-stripe"
                              patternUnits="userSpaceOnUse"
                              width="12"
                              height="12"
                              patternTransform="rotate(45)"
                            >
                              <rect
                                x="0"
                                y="0"
                                width="6"
                                height="12"
                                fill="#22c55e"
                              />
                              <rect
                                x="6"
                                y="0"
                                width="6"
                                height="12"
                                fill="#eab308"
                              />
                            </pattern>
                          </defs>
                          {cables
                            .flatMap((c) => c.wires)
                            .map((wire) => {
                              if (!wire.wagoId) return null;
                              const wago = wagos.find(
                                (w) => w.id === wire.wagoId
                              );
                              if (!wago) return null;
                              const wirePos = getWirePosition(wire);
                              const wagoPos = wago.position;
                              const strokeColor =
                                wire.color === "green-yellow"
                                  ? "url(#pe-stripe)"
                                  : getWireStrokeColor(wire.color);
                              const pathData = calculateOrthogonalPath(
                                wirePos,
                                wagoPos,
                                wire.id,
                                wire.color
                              );
                              return (
                                <g key={wire.id}>
                                  <path
                                    d={pathData}
                                    stroke={strokeColor}
                                    strokeWidth="4"
                                    fill="none"
                                    opacity="0.3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d={pathData}
                                    stroke={strokeColor}
                                    strokeWidth="2.5"
                                    fill="none"
                                    opacity="0.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </g>
                              );
                            })}
                        </svg>

                        {/* Entry points */}
                        {entryPoints.map((point) => {
                          const pos = getEntryPointPosition(
                            point,
                            currentBoxConfig
                          );
                          const cable = cables.find(
                            (c) => c.entryPoint === point
                          );
                          const hasCable = !!cable;
                          const [side] = point.split("-");

                          // label positioning relative to entry dot
                          const labelOffset = 32; // px distance from the dot
                          const labelStyle: React.CSSProperties = (() => {
                            // Position label RELATIVE to the dot wrapper (which is centered at pos)
                            // We use nested transforms to offset by pixels without relying on outer coordinates
                            switch (side) {
                              case "top":
                                return {
                                  left: 0,
                                  top: 0,
                                  transform: `translate(-50%, -50%) translate(0, -${labelOffset}px)`,
                                };
                              case "bottom":
                                return {
                                  left: 0,
                                  top: 0,
                                  transform: `translate(-50%, -50%) translate(0, ${labelOffset}px)`,
                                };
                              case "left":
                                return {
                                  left: 0,
                                  top: 0,
                                  transform: `translate(-50%, -50%) translate(-${labelOffset}px, 0)`,
                                };
                              case "right":
                                return {
                                  left: 0,
                                  top: 0,
                                  transform: `translate(-50%, -50%) translate(${labelOffset}px, 0)`,
                                };
                              default:
                                return {
                                  left: 0,
                                  top: 0,
                                  transform: "translate(-50%, -50%)",
                                };
                            }
                          })();

                          return (
                            <div
                              key={point}
                              className="absolute"
                              style={{
                                left: pos.x,
                                top: pos.y,
                                transform: "translate(-50%, -50%)",
                              }}
                            >
                              <button
                                onClick={() => handleEntryPointClick(point)}
                                aria-label={
                                  hasCable
                                    ? cable?.name || getEntryPointLabel(point)
                                    : `Öffnung ${getEntryPointLabel(point)}`
                                }
                                className={`w-9 h-9 rounded-full shadow-lg border-3 flex items-center justify-center transition-all touch-manipulation hover:scale-110 ${
                                  hasCable
                                    ? "bg-primary border-primary-foreground cursor-default"
                                    : "bg-secondary border-border hover:bg-primary/20 cursor-pointer"
                                }`}
                              >
                                {hasCable ? (
                                  <Cable className="w-4 h-4 text-primary-foreground" />
                                ) : (
                                  <div className="w-2 h-2 rounded-full bg-muted" />
                                )}
                              </button>

                              {hasCable && cable?.name && (
                                <div
                                  className="absolute pointer-events-none select-none"
                                  style={labelStyle}
                                >
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <LabelPill
                                          text={cable.name}
                                          className="pointer-events-auto"
                                        />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        {cable.name}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Wago terminals */}
                        {wagos.map((wago) => {
                          const connectedWires = getWagoWires(wago.id);
                          return (
                            <div key={wago.id} className="relative">
                              <WagoTerminal
                                id={wago.id}
                                position={wago.position}
                                connectedWires={connectedWires.map((w) => ({
                                  id: w.id,
                                  label: w.label,
                                  color: getWireColorClass(w.color),
                                }))}
                                onDragOver={(e) =>
                                  !isReadonly && handleWagoDragOver(e, wago.id)
                                }
                                onDrop={(e) => !isReadonly && handleWagoDrop(e, wago.id)}
                                onDragLeave={handleWagoDragLeave}
                                isDragOver={dragOverWago === wago.id}
                                onPositionChange={isReadonly ? undefined : handleWagoPositionChange}
                                boxWidth={getBoxSize(currentBoxConfig)}
                                boxHeight={getBoxHeight(currentBoxConfig)}
                              />
                              {!isReadonly && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleRemoveWago(wago.id)}
                                  className="absolute h-6 w-6 -top-1 left-8 z-40 opacity-70 hover:opacity-100"
                                  style={{
                                    left: `${wago.position.x + 20}px`,
                                    top: `${wago.position.y - 20}px`,
                                    transform: "translate(-50%, -50%)",
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          );
                        })}

                        {/* Wire dots at entry points (only for unconnected wires) */}
                        {cables
                          .flatMap((c) => c.wires)
                          .map((wire) => {
                            if (wire.wagoId) return null;
                            const pos = getWirePosition(wire);
                            const isDragging = draggedWire === wire.id;
                            return (
                              <div
                                key={wire.id}
                                draggable={!isReadonly}
                                onDragStart={() => !isReadonly && handleDragStart(wire.id)}
                                className={`absolute w-4 h-4 rounded-full ${getWireColorClass(
                                  wire.color
                                )} shadow-md border border-background ${
                                  isReadonly ? "cursor-default" : "cursor-move"
                                } touch-manipulation transition-all ${
                                  isDragging
                                    ? "scale-110 opacity-50 z-50"
                                    : "z-20"
                                } ${isReadonly ? "" : "hover:scale-125"}`}
                                style={{
                                  left: `${pos.x}px`,
                                  top: `${pos.y}px`,
                                  transform: "translate(-50%, -50%)",
                                }}
                                title={wire.label}
                              />
                            );
                          })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Unified floating controls (all screens) */}
            <div
              className="absolute right-3 bottom-3 z-50 flex flex-col gap-2"
              data-pan-ignore
            >
              <Button
                size="icon"
                className="h-10 w-10 rounded-full shadow-md"
                variant="secondary"
                onClick={handleZoomIn}
                title="Zoom in"
              >
                <Plus className="h-5 w-5" />
              </Button>
              <Button
                size="icon"
                className="h-10 w-10 rounded-full shadow-md"
                variant="secondary"
                onClick={handleZoomOut}
                title="Zoom out"
              >
                <Minus className="h-5 w-5" />
              </Button>
              <Button
                size="icon"
                className="h-10 w-10 rounded-full shadow-md"
                variant="secondary"
                onClick={handleCenter}
                title="Zentrieren"
              >
                <RefreshCw className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

      <AddCableDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdd={handleAddCable}
        entryPoint={
          selectedEntryPoint ? getEntryPointLabel(selectedEntryPoint) : ""
        }
      />

      <EditCableDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onUpdate={handleUpdateCable}
        cable={editingCable}
      />

      <Dialog open={boxTypeDialogOpen} onOpenChange={setBoxTypeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Abzweigdose auswählen</DialogTitle>
            <DialogDescription>
              Wählen Sie die Größe Ihrer Abzweigdose.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {boxConfigurations.map((config) => (
              <Card
                key={config.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  boxType === config.id
                    ? "border-primary border-2 bg-primary/5"
                    : "border"
                }`}
                onClick={() => handleChangeBoxType(config.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-base">{config.name}</h3>
                      {boxType === config.id && (
                        <Badge variant="default" className="text-xs">
                          Aktiv
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground mb-2">
                      {config.description}
                    </p>

                    <div className="mt-2">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Eingänge pro Seite
                      </p>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">
                          Oben {config.entryPoints.top}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Rechts {config.entryPoints.right}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Unten {config.entryPoints.bottom}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Links {config.entryPoints.left}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm reset when changing dosen type */}
      <AlertDialog open={confirmResetOpen} onOpenChange={setConfirmResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dosentyp ändern?</AlertDialogTitle>
            <AlertDialogDescription>
              Beim Wechsel des Dosentyps wird die aktuelle Konfiguration vollständig zurückgesetzt.
              Alle Leitungen, Verbindungen und Wago-Klemmen werden entfernt. Möchten Sie fortfahren?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={confirmApplyBoxType} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Ja, zurücksetzen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Konfiguration exportieren</DialogTitle>
            <DialogDescription>
              Laden Sie Ihre Abzweigdose-Konfiguration als JSON-Datei herunter.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {exportFromSavedId ? (
              <p className="text-xs text-muted-foreground">
                Quelle: Gespeicherte Konfiguration – {savedConfigs.find((c) => c.id === exportFromSavedId)?.name || "Unbekannt"}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Quelle: Aktuelle Konfiguration</p>
            )}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="readonly"
                checked={exportReadonly}
                onCheckedChange={(checked) => setExportReadonly(checked === true)}
              />
              <label
                htmlFor="readonly"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Schreibgeschützt exportieren
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Wenn aktiviert, kann die importierte Konfiguration nicht bearbeitet werden.
              Dies ist nützlich zum Teilen von Vorlagen oder Dokumentation.
            </p>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setExportDialogOpen(false);
                  setExportReadonly(false);
                  setExportFromSavedId(null);
                }}
              >
                Abbrechen
              </Button>
              <Button onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Exportieren
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Config Manager Dialog */}
      <Dialog open={configManagerOpen} onOpenChange={setConfigManagerOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Konfigurationen verwalten</DialogTitle>
            <DialogDescription>
              Speichern, laden und teilen Sie Ihre Abzweigdose-Konfigurationen
            </DialogDescription>
          </DialogHeader>
          
          {/* Save Current Config Section */}
          {!isReadonly && (
            <div className="border rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-sm">Aktuelle Konfiguration speichern</h3>
              <div className="space-y-2">
                <Input
                  placeholder="Name (erforderlich)"
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                />
                <Input
                  placeholder="Beschreibung (optional)"
                  value={configDescription}
                  onChange={(e) => setConfigDescription(e.target.value)}
                />
                <Button onClick={handleSaveConfig} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Speichern
                </Button>
              </div>
            </div>
          )}

          {/* Saved Configs List */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">
              Gespeicherte Konfigurationen ({savedConfigs.length})
            </h3>
            
            {savedConfigs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Keine gespeicherten Konfigurationen</p>
              </div>
            ) : (
              <div className="space-y-2">
                {savedConfigs.map((config) => (
                  <Card key={config.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm">{config.name}</h4>
                          {config.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {config.description}
                            </p>
                          )}
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {boxConfigurations.find((b) => b.id === config.boxType)?.name}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {config.cables.length} Leitungen
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {config.wagos.length} WAGOs
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Gespeichert: {new Date(config.savedAt).toLocaleString("de-DE")}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleLoadConfig(config.id)}
                          className="flex-1"
                        >
                          <FolderOpen className="w-3 h-3 mr-2" />
                          Laden
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExportSavedConfig(config.id)}
                          className="flex-1"
                        >
                          <Share2 className="w-3 h-3 mr-2" />
                          Teilen
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteConfig(config.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Drawer for cable list */}
      <Drawer open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
        <DrawerContent className="max-w-2xl mx-auto">
          <DrawerHeader>
            <DrawerTitle>Leitungen & Verbindungen</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 pb-6 overflow-y-auto max-h-[75vh]">
            {renderCableList()}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};
