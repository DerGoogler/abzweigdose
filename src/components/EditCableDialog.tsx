import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";

interface EditCableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (wireCount: 3 | 5, crossSection: string, name: string, description: string) => void;
  cable: {
    wireCount: 3 | 5;
    crossSection: string;
    name?: string;
    description?: string;
  } | null;
}

export const EditCableDialog = ({
  open,
  onOpenChange,
  onUpdate,
  cable,
}: EditCableDialogProps) => {
  const [wireCount, setWireCount] = useState<3 | 5>(3);
  const [crossSection, setCrossSection] = useState("1.5");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (cable) {
      setWireCount(cable.wireCount);
      setCrossSection(cable.crossSection);
      setName(cable.name || "");
      setDescription(cable.description || "");
    }
  }, [cable]);

  const handleUpdate = () => {
    onUpdate(wireCount, crossSection, name, description);
  };

  if (!cable) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Leitung bearbeiten</DialogTitle>
          <DialogDescription>
            Ändern Sie die Eigenschaften der Leitung
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-cable-name">Name (optional)</Label>
            <Input
              id="edit-cable-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Küche Herd, Wohnzimmer Steckdose..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-cable-description">Beschreibung (optional)</Label>
            <Textarea
              id="edit-cable-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Zusätzliche Informationen zur Leitung..."
              className="resize-none"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Aderzahl</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={wireCount === 3 ? "default" : "outline"}
                onClick={() => setWireCount(3)}
                className="w-full"
              >
                3-adrig
                <span className="ml-2 text-xs opacity-70">(L, N, PE)</span>
              </Button>
              <Button
                type="button"
                variant={wireCount === 5 ? "default" : "outline"}
                onClick={() => setWireCount(5)}
                className="w-full"
              >
                5-adrig
                <span className="ml-2 text-xs opacity-70">(L1-3, N, PE)</span>
              </Button>
            </div>
            {wireCount !== cable.wireCount && (
              <p className="text-xs text-destructive">
                ⚠️ Änderung der Aderzahl trennt alle Verbindungen
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-cross-section">Querschnitt</Label>
            <Select value={crossSection} onValueChange={setCrossSection}>
              <SelectTrigger id="edit-cross-section">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1.5">1,5 mm²</SelectItem>
                <SelectItem value="2.5">2,5 mm²</SelectItem>
                <SelectItem value="4">4 mm²</SelectItem>
                <SelectItem value="6">6 mm²</SelectItem>
                <SelectItem value="10">10 mm²</SelectItem>
                <SelectItem value="16">16 mm²</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleUpdate}>Speichern</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
