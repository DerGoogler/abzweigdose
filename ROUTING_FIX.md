# Routing Fix

Die Funktion `calculateOrthogonalPath` in JunctionBox.tsx muss vereinfacht werden.

Entfernen Sie diese Zeilen (336-345):
```typescript
// Calculate which "layer" this wire should use to avoid overlap with same-label wires
const allConnectedWires = cables.flatMap(c => c.wires).filter(w => w.wagoId !== null);

// Group by label and side to determine routing layer
const sameTypeWires = allConnectedWires.filter(w => 
  w.label === wire.label && 
  cables.find(c => c.id === w.cableId)?.entryPoint.split("-")[0] === side
).sort((a, b) => a.id.localeCompare(b.id));

const layerIndex = sameTypeWires.findIndex(w => w.id === wireId);
const spacing = 10; // Spacing between parallel wires of same type
```

Und ändern Sie die Routing-Berechnungen:
- Zeile 361: `const firstTurn = wirePos.y + direction * 25;` (statt `30 + layerIndex * spacing`)
- Zeile 368: `const firstTurn = wirePos.x + direction * 25;` (statt `30 + layerIndex * spacing`)
