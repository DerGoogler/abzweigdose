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
import { useState } from "react";

interface AddCableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (wireCount: 3 | 5, crossSection: string, name: string, description: string) => void;
  entryPoint: string;
}

export const AddCableDialog = ({
  open,
  onOpenChange,
  onAdd,
  entryPoint,
}: AddCableDialogProps) => {
  const [wireCount, setWireCount] = useState<3 | 5>(3);
  const [crossSection, setCrossSection] = useState("1.5");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleAdd = () => {
    onAdd(wireCount, crossSection, name, description);
    onOpenChange(false);
    // Reset form
    setName("");
    setDescription("");
    setWireCount(3);
    setCrossSection("1.5");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Leitung hinzufügen</DialogTitle>
          <DialogDescription>
            Fügen Sie eine neue Leitung zu {entryPoint} hinzu
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="cable-name">Name (optional)</Label>
            <Input
              id="cable-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Küche Herd, Wohnzimmer Steckdose..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cable-description">Beschreibung (optional)</Label>
            <Textarea
              id="cable-description"
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="cross-section">Querschnitt</Label>
            <Select value={crossSection} onValueChange={setCrossSection}>
              <SelectTrigger id="cross-section">
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
          <Button onClick={handleAdd}>Hinzufügen</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
