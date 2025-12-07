# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Delta Force loot simulator (三角洲舔包模拟器) - a web-based game that simulates the looting mechanics from the Delta Force mobile game. Players can practice organizing inventory, managing equipment slots, and maximizing loot value within a time limit. Built with TypeScript, Vite, and PixiJS for 2D rendering.

## Development Commands

### Basic Commands
```bash
npm install          # Install dependencies
npm run dev          # Start development server (with --host 0.0.0.0)
npm run build        # Build for production (runs TypeScript compiler + Vite)
npm run preview      # Preview production build
```

### Development Notes
- Development server runs on `0.0.0.0` to allow network access
- Build process runs TypeScript compiler before Vite bundling
- In development mode, the app uses API endpoints for data (config.ts:109-111)

## Architecture Overview

### Core Game Loop
The application follows this initialization flow:
1. `main.ts` creates and initializes the `Game` instance
2. `Game.init()` loads resources and creates the PixiJS application
3. Game creates three main regions: `playerRegion` (equipment), `spoilsRegion` (loot boxes), and `controlPanelRegion` (UI controls)
4. Each region contains one or more `Inventory` instances
5. Items are managed through drag-and-drop interactions

### Key Components Hierarchy

```
Game (game.ts)
├── PixiJS Application (canvas rendering)
├── TitleBar (top bar)
├── ItemManager (manages all item data and resources)
├── Regions (region.ts)
│   ├── playerRegion (individual equipment)
│   │   └── Inventory (player box with equipment slots)
│   │       ├── Equipment Slots (Subgrids for helmet, armor, weapons, etc.)
│   │       ├── ChestRig Container (GridContainer with dynamic subgrids)
│   │       ├── Backpack Container (GridContainer with dynamic subgrids)
│   │       └── Secure Container (GridContainer, 3x3, rejects weapons/armor)
│   ├── spoilsRegion (loot boxes and ground)
│   │   ├── Inventory (loot boxes or player containers)
│   │   │   └── Subgrid (7x8 grid typically)
│   │   └── Inventory (ground container - 15x8 grid, always visible)
│   └── controlPanelRegion (fixed width 246px on right side)
│       ├── TotalValueDisplay
│       ├── Timer
│       ├── GroundButton, ResetButton, ScreenshotButton
│       └── SearchAllButton, AutoOptimizeButton
└── Items (item.ts)
    ├── Container (PIXI.Container)
    ├── Graphics (background, borders, text)
    ├── Subgrids (for containers like backpacks/chest rigs)
    └── Accessories (for weapons - scopes, muzzles, etc.)
```

### Grid System

The inventory system uses a nested grid structure:

- **Subgrid** (subgrid.ts): Basic grid unit, can be a weapon slot (1x1 fullfill), backpack grid (variable size), or loot box (7x8)
  - `fullfill: true` = Single item slot (adapts to grid size, used for equipment slots)
  - `fullfill: false` = Multi-item grid (items use their actual cell dimensions)
  - Has `acceptedTypes` (whitelist) and `rejectedTypes` (blacklist) for type filtering

- **GridContainer** (gridContainer.ts): Contains multiple Subgrids with flexible layouts
  - Used for backpack/chest rig internal storage
  - Defined by `layout` array: `[width, height, xOffset, yOffset]` for each subgrid
  - Can be associated with a container item (backpack/chest rig)

- **Inventory** (invntory.ts): Top-level container grouping multiple grids/containers
  - `scrollable: true` = Player box (full equipment slots + containers)
  - `scrollable: false` = Loot box (single Subgrid, size adapts to available space)
  - `scrollable: 2` = Ground container (fixed 15x8 grid)

### Item Interaction System

Items (item.ts) implement complex drag-and-drop logic:

1. **Drag Detection**: `onDragMove` detects movement >3px to start dragging
2. **Preview Indicator**: Shows green/red overlay indicating valid/invalid placement
3. **Interaction Types**:
   - **Simple Placement**: Placing item in empty space
   - **Rotation**: Press 'R' during drag to rotate item (swaps cellWidth/cellHeight)
   - **Item Swap**: Dragging onto another item exchanges positions if compatible
   - **Stacking**: Same items stack up to `maxStackCount` (used for ammo)
   - **Ammo Loading**: Dragging ammo onto compatible weapons loads the weapon
   - **Accessory Attachment**: Dragging scopes/muzzles/etc onto weapons attaches them
   - **Quick Transfer**: Double-click or press 'F' to transfer item to opposite region

4. **Container Rules**:
   - Backpacks and chest rigs only function when equipped in designated slots
   - Nesting containers (backpack in backpack) empties the nested container to ground
   - Dropping containers to ground empties their contents

### Resource Loading

**ItemManager** (itemManager.ts) handles all game data:

- Supports three CDN modes (config.ts:77-321):
  - `local`: Load from `/public/json/` files
  - `jsdelivr`: Load from GitHub via CDN
  - `api`: Load from backend API endpoints (used in development)

- Data sources:
  - Item definitions (weapons, armor, collectibles, accessories)
  - Gun slot mappings (which accessories fit which weapons)
  - Real-time item values (prices in Haf币)

- API responses use format: `{success: true, data: {jData: {data: {data: {list: [...]}}}}}` or `{success: true, data: {list: [...]}}`
- Local JSON uses format: `{jData: {data: {data: {list: [...]}}}}`

### Responsive Layout

The game uses a responsive layout system (config.ts:29-75):

- Base design: 1334x750 (16:9 aspect ratio)
- Canvas auto-resizes to window while maintaining 16:9 aspect
- Three regions scale independently:
  - **playerRegion**: Fixed 800px width on left
  - **spoilsRegion**: Flexible width in center (fills remaining space)
  - **controlPanelRegion**: Fixed 246px width on right

### Search System

Items in spoils region require "searching" before they can be interacted with:

- Magnify animation (magnify.ts) appears over items being searched
- Search time defined per item (default 1.2s)
- Controlled by `config.needSearch` flag
- Search happens automatically in order, one item at a time
- Update loop in `Inventory.update()` manages search progression

## Important Patterns

### Item Type System
Items use a two-tier classification:
- `primaryClass`: Main category (gun, protect, container, acc, collectible, ammo, consumable)
- `secondClass`: Specific type (gunRifle, gunPistol, armor, helmet, bag, chest, accScope, accMuzzle, etc.)

Type names in code use camelCase (e.g., `gunRifle`, `accScope`), matching the secondClass field.

### Coordinate Systems
- Grid positions: `(col, row)` in grid cells
- Pixel positions: Calculated as `col * cellSize * aspect, row * cellSize`
- Global positions: PixiJS global coordinates for drag-and-drop

### Equipment Slots (in Player Inventory)
Hard-coded equipment configuration (invntory.ts:109-135):
- Primary Weapon 1 & 2: 2:1 aspect ratio, accepts rifles/SMGs/shotguns/LMG/MP/snipers
- Secondary Weapon: 1:1 aspect, accepts pistols only
- Helmet, Armor, Knife: 1:1 aspect slots
- ChestRig slot + dynamic ChestRig container
- Backpack slot + dynamic Backpack container
- Pocket: 5x 1:1 slots in a row
- Secure Container: 3x3 grid, rejects weapons/armor/accessories (black list)

### Value Calculation
Total value is computed recursively:
- Base item value × stack count
- Plus values of all contained items (in backpacks/chest rigs)
- Plus values of loaded ammo (in weapons)
- Plus values of attached accessories (on weapons)
- Displayed in control panel via `TotalValueDisplay`

## Common Workflows

### Adding a New Item Type
1. Add item data to appropriate JSON file in `/public/json/` or backend database
2. Include required fields: `objectID`, `objectName`, `primaryClass`, `secondClass`, `grade`, `length`, `width`, `pic` (image URL)
3. For containers: add `subgridLayout` array
4. For weapons: add `gunDetail` with `caliber`, `capacity`, and `accessory` slots
5. Add price to values API/JSON

### Creating a New UI Component
1. Create component in `/src/components/`
2. Must have a `container` (PIXI.Container) and `additiveSize` property
3. Add to Region using `region.addComponent(name, ComponentClass)`
4. Components auto-stack vertically with 12px spacing

### Debugging Item Interactions
- Check `window.game` in console (exposed globally)
- Use `window.game.grids` to inspect all Subgrids
- Item drag states: `isDragging`, `previewIndicator`, `dragOverlay`
- Grid validation: `checkBoundary()`, `checkAccept()`, `checkForOverlap()`

## File Organization

```
src/
├── main.ts                 # Entry point
├── game.ts                 # Main game class
├── config.ts               # Game configuration and layout
├── types.ts                # TypeScript interfaces
├── item.ts                 # Item class (drag, drop, interactions)
├── itemManager.ts          # Resource loading and item data
├── region.ts               # Region container (title bar + content)
├── invntory.ts             # Inventory system (equipment + containers)
├── subgrid.ts              # Basic grid cell system
├── gridContainer.ts        # Multi-grid container (backpacks, etc.)
├── gridTitle.ts            # Text labels for grid sections
├── magnify.ts              # Search animation
├── utils.ts                # Helper functions
└── components/             # UI components (buttons, timers, dialogs)
    ├── timer.ts
    ├── TotalValueDisplay.ts
    ├── RegionSwitchUI.ts
    ├── TabSwitchUI.ts
    └── ...

public/
├── json/                   # Game data (items, values, layouts)
│   ├── gun/               # Weapon definitions
│   ├── acc/               # Accessory definitions
│   ├── protect/           # Armor, helmet, backpack, chest rig
│   ├── props/             # Collectibles, consumables, keys
│   └── gunSlotMap.json    # Weapon accessory compatibility
└── deltaforce.png         # Game icon
```

## Known Issues & TODOs (from README)

- Item search functionality (bug)
- Settings/management/debug interface (placeholder)
- Double-click quick pickup (bug)
- Item drag sometimes bugs out
- Dragging backpack with items causes items to disappear
- Some cells cannot accept items / placement offset issues
- Some item UI display anomalies
