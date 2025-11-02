# PWA Icon Generation

This project now supports PWA (Progressive Web App) functionality!

## Icon Information

The icon includes:
- Junction box symbol with lightning bolt
- Three wire color indicators:
  - **Brown** (top left) - Phase L1
  - **Blue** (top right) - Neutral N
  - **Green-Yellow striped** (bottom) - Protective Earth PE

## Generating PNG Icons

To generate the required PNG icons from the SVG:

### Option 1: Use the HTML Generator
1. Open `generate-icons.html` in a web browser
2. Right-click on each canvas and save as PNG:
   - Save as `icon-192.png` (192x192)
   - Save as `icon-512.png` (512x512)
3. Place both PNG files in the `public` folder

### Option 2: Use Online Tools
1. Go to https://cloudconvert.com/svg-to-png or similar
2. Upload `public/icon.svg`
3. Convert to 192x192 and save as `icon-192.png`
4. Convert to 512x512 and save as `icon-512.png`
5. Place both files in the `public` folder

### Option 3: Use Command Line (requires sharp)
```bash
bun add -D sharp sharp-cli
npx sharp -i public/icon.svg -o public/icon-192.png resize 192 192
npx sharp -i public/icon.svg -o public/icon-512.png resize 512 512
```

## PWA Features

Once icons are generated, the app provides:
- ✅ Offline functionality via Service Worker
- ✅ Install prompt on mobile devices
- ✅ Standalone app experience
- ✅ Fast loading with caching
- ✅ Auto-update notifications

## Testing PWA

1. Build the app: `bun run build`
2. Preview: `bun run preview`
3. Open in browser and use DevTools > Application > Manifest to verify
4. Test "Add to Home Screen" on mobile devices
