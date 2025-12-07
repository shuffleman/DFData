# CLAUDE.md - AI Assistant Guide for DFData Repository

> Last Updated: 2025-12-07
> Repository: DFData - Game Equipment Data Management System

## Table of Contents

1. [Project Overview](#project-overview)
2. [Repository Structure](#repository-structure)
3. [Technology Stack](#technology-stack)
4. [Development Workflows](#development-workflows)
5. [Code Conventions](#code-conventions)
6. [Data Architecture](#data-architecture)
7. [Key Components](#key-components)
8. [Testing & Building](#testing--building)
9. [Common Tasks](#common-tasks)
10. [Important Notes](#important-notes)

---

## Project Overview

**DFData** is a comprehensive game equipment data management system designed for managing and visualizing game items, weapons, accessories, and equipment. The project consists of:

- **Electron Desktop Application**: A data management tool for viewing, editing, and analyzing game item data
- **Loot Game**: An interactive PixiJS-based game for loot management and inventory systems
- **Data Processing Pipeline**: Python scripts for normalizing and processing raw game data

### Primary Use Cases

1. Managing game item catalogs (weapons, accessories, protection, consumables, collectibles)
2. Visualizing item statistics and distributions
3. Testing inventory systems and loot mechanics
4. Providing a user-friendly interface for non-technical team members to edit game data

---

## Repository Structure

```
DFData/
├── .github/                   # GitHub configuration
│   └── workflows/             # GitHub Actions CI/CD workflows
│       ├── build-release.yml  # Automated build and release workflow
│       └── README.md          # CI/CD documentation
├── electron-app/              # Main Electron desktop application
│   ├── src/
│   │   ├── game/              # Game logic (PixiJS-based)
│   │   │   ├── components/    # UI components (ControlPanel, LootArea, PlayerArea)
│   │   │   ├── core/          # Core systems (GridSystem, DragDropSystem, Inventory, etc.)
│   │   │   ├── entities/      # Game entities (Item)
│   │   │   ├── managers/      # Data and resource managers
│   │   │   ├── types/         # TypeScript type definitions
│   │   │   ├── config.ts      # Game configuration
│   │   │   ├── Game.ts        # Main game class
│   │   │   └── main.ts        # Entry point
│   │   └── app.js             # Electron renderer process
│   ├── assets/                # Application assets
│   │   └── README.md          # Icon requirements documentation
│   ├── normalized_data/       # Copy of normalized data
│   ├── main.js                # Electron main process
│   ├── preload.js             # Electron preload script
│   ├── package.json           # Dependencies and build config
│   ├── tsconfig.json          # TypeScript configuration
│   ├── webpack.config.js      # Webpack bundler config
│   ├── 使用指南.md            # User guide (Chinese)
│   └── Windows打包说明.md     # Windows packaging guide (Chinese)
├── loot-game/                 # Standalone loot game implementation
│   └── src/                   # Similar structure to electron-app/src/game
├── normalized_data/           # Master data files (JSON)
│   ├── items_catalog.json     # Main item catalog (all items)
│   ├── weapons_spec.json      # Weapon specifications
│   ├── accessories_spec.json  # Accessory specifications
│   ├── ammunitions_spec.json  # Ammunition data
│   ├── protection_spec.json   # Protective equipment data
│   ├── consumables_spec.json  # Consumable items
│   ├── collectibles_spec.json # Collectible items
│   ├── slot_system.json       # Weapon modification slot system
│   ├── index.json             # Quick lookup index
│   └── OPTIMIZATION_REPORT.md # Data optimization notes
├── process_props.py           # Python script for processing raw data
└── .gitignore                 # Git ignore rules (excludes raw data, images, temp files)
```

### Directory Purposes

- **.github/**: GitHub Actions CI/CD workflows and automation
- **electron-app/**: Production-ready desktop application for data management
  - **assets/**: Application icons and resources for packaging
- **loot-game/**: Experimental/testing game environment
- **normalized_data/**: Single source of truth for all game item data
- **Root level**: Data processing scripts and configuration

---

## Technology Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | Latest LTS | Runtime environment |
| **Electron** | v28.0.0 | Desktop application framework |
| **TypeScript** | v5.9.3 | Type-safe JavaScript |
| **PixiJS** | v7.3.2 | 2D graphics rendering |
| **Vue** | v3.4.0 | UI components (planned/partial) |
| **Webpack** | v5.103.0 | Module bundler |
| **Python** | 3.x | Data processing scripts |

### Build Tools

- **ts-loader**: TypeScript compilation for Webpack
- **electron-builder**: Application packaging for distribution

### Key Dependencies

```json
{
  "pixi.js": "^7.3.2",      // Graphics engine
  "vue": "^3.4.0",          // UI framework
  "electron": "^28.0.0",    // Desktop app framework
  "typescript": "^5.9.3",   // Type system
  "webpack": "^5.103.0"     // Module bundler
}
```

---

## Development Workflows

### Initial Setup

```bash
# 1. Install dependencies for Electron app
cd electron-app
npm install

# 2. Build the game bundle
npm run build:game

# 3. Start the application
npm start
```

### Development Mode

```bash
# Watch mode for TypeScript compilation
npm run watch:game

# In another terminal, run Electron
npm start
```

### Building for Production

```bash
# Build the game bundle
npm run build:game

# Package the Electron app
npm run build
```

**Output**: `electron-app/dist/` contains packaged application

### Data Processing Workflow

```bash
# Process raw data (price.json) into normalized format
python process_props.py
```

This script:
1. Reads `price.json` (raw data, not in git)
2. Categorizes items by `secondClass` field
3. Generates normalized JSON files in `normalized_data/`
4. Updates `items_catalog.json` with new items
5. Creates `props_image_urls.json` for image downloading

---

## Code Conventions

### TypeScript Path Aliases

The project uses TypeScript path aliases defined in `tsconfig.json`:

```typescript
// Instead of: import { Subgrid } from '../../../core/Subgrid'
import { Subgrid } from '@core/Subgrid';

// Available aliases:
import { ... } from '@core/*';       // core systems
import { ... } from '@components/*'; // UI components
import { ... } from '@types';        // type definitions
import { ... } from '@entities/*';   // game entities
import { ... } from '@managers/*';   // managers
```

**Webpack config** mirrors these aliases in `webpack.config.js`.

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| **Classes** | PascalCase | `DataManager`, `GridSystem`, `Item` |
| **Files** | PascalCase (classes) | `DataManager.ts`, `GridSystem.ts` |
| **Variables** | camelCase | `playerRegion`, `isGameStarted` |
| **Constants** | UPPER_SNAKE_CASE | `GAME_WIDTH`, `GAME_HEIGHT` |
| **Private methods** | camelCase with `private` | `private initDefaultSpoilsRegionConfig()` |
| **Interfaces** | PascalCase (no "I" prefix) | `ItemData`, `RegionConfig` |

### Code Organization Patterns

#### 1. Class Structure

```typescript
export class ClassName {
  // ========== Static Properties ==========
  static readonly CONSTANT = value;

  // ========== Instance Properties ==========
  public publicProp: Type;
  private privateProp: Type;

  // ========== Constructor ==========
  constructor(params) {
    // Initialize
  }

  // ========== Public Methods ==========
  public publicMethod(): void {
    // Implementation
  }

  // ========== Private Methods ==========
  private privateMethod(): void {
    // Implementation
  }

  // ========== Lifecycle Methods ==========
  destroy(): void {
    // Cleanup
  }
}
```

#### 2. File Headers

Major files include JSDoc headers:

```typescript
/**
 * Game - 游戏主类
 * 游戏的核心控制器，管理 PIXI 应用、数据加载、区域管理和游戏流程
 */
```

#### 3. Console Logging

Use descriptive prefixes for debugging:

```typescript
console.log('[Game] 游戏实例已创建');
console.log('[DataManager] 加载资源完成');
console.error('[Game] 游戏初始化失败:', error);
```

### TypeScript Configuration

- **Target**: ES2020
- **Module**: ES2020
- **Strict mode**: Disabled (`strict: false`)
- **Source maps**: Enabled
- **Declaration files**: Generated

---

## Data Architecture

### Data File Structure

All data files follow this pattern:

```json
{
  "metadata": {
    "version": "1.0",
    "description": "...",
    "exportTime": "2025-12-01T02:31:45.040187",
    "counts": {
      "total": 123
    }
  },
  "items": [
    {
      "objectID": 12345,
      "id": 1001,
      "category": "weapon",
      // ... item-specific fields
    }
  ]
}
```

### Item Catalog Schema

**items_catalog.json** contains all items with basic info:

```json
{
  "metadata": {
    "version": "1.0",
    "description": "物品总目录"
  },
  "items": {
    "18060000011": {          // objectID as key
      "id": 10756,
      "objectID": 18060000011,
      "category": "weapon",
      "objectName": "AWM狙击步枪",
      "avgPrice": 571299,
      "grade": 5,
      "picture": "https://..."
    }
  }
}
```

### Specialized Data Files

Each category has a `*_spec.json` file with detailed attributes:

- **weapons_spec.json**: Weapon stats, caliber, fire modes, etc.
- **accessories_spec.json**: Attachment types, compatible slots, modifiers
- **protection_spec.json**: Armor values, durability, coverage
- **ammunitions_spec.json**: Caliber, damage, penetration
- **consumables_spec.json**: Effects, duration, cooldown
- **collectibles_spec.json**: Rarity, collection sets
- **slot_system.json**: Weapon modification slots and compatibility (1.7MB - largest file)

### Data Categories

| Category | secondClass | File |
|----------|-------------|------|
| Weapons | `weapon` | weapons_spec.json |
| Accessories | `parts` | accessories_spec.json |
| Ammunition | `ammo` | ammunitions_spec.json |
| Protection | `equipment` | protection_spec.json |
| Consumables | `consume` | consumables_spec.json |
| Collectibles | `collection` | collectibles_spec.json |

### Key Data Fields

```typescript
// Common to all items
interface BaseItem {
  objectID: number;        // Unique identifier (primary key)
  id: number;              // Internal ID
  category: string;        // Item category
  objectName: string;      // Display name
  avgPrice: number;        // Average price
  grade: number;           // Quality grade (0-6)
  picture: string;         // Image URL
  length?: number;         // Grid length (for inventory)
  width?: number;          // Grid width (for inventory)
  weight?: number;         // Item weight
}
```

---

## Key Components

### Game Architecture

```
Game (main controller)
├── DataManager (loads and manages all data)
├── Regions (UI areas)
│   ├── PlayerRegion (player inventory)
│   ├── SpoilsRegion (loot containers)
│   └── ControlPanelRegion (UI controls)
└── Systems
    ├── GridSystem (inventory grid logic)
    ├── DragDropSystem (item dragging)
    └── Inventory (item storage and management)
```

### Core Classes

#### 1. Game (`Game.ts`)

Main game controller, manages:
- PIXI application lifecycle
- Data loading via DataManager
- Region creation and layout
- Game state (started/initialized)
- Window resizing and responsive layout

**Key methods**:
- `init()`: Initialize game, load data, create UI
- `startGame()`: Create spoils region and start gameplay
- `resetGame()`: Clear spoils region
- `findGrid(x, y)`: Find grid at global coordinates (for drag-drop)

#### 2. DataManager (`managers/DataManager.ts`)

Loads and provides access to all game data:
- Item catalog
- Weapon specifications
- Accessories, ammunition, protection data
- Slot system for weapon modifications

**Key methods**:
- `loadResources(config)`: Load all data from URLs or local files
- `getItemInfo(objectID)`: Get item by objectID
- `getRandomItemWithPreset(preset)`: Generate random item for testing

#### 3. Region (`core/Region.ts`)

Represents a UI area containing inventories:
- Title bar with name and stats
- Multiple inventories (tabs/containers)
- Layout management
- Responsive resizing

**Examples**:
- Player inventory region
- Loot area region (ground containers, loot boxes)
- Control panel region

#### 4. Inventory (`core/Inventory.ts`)

Container for items with grid-based storage:
- Subgrids (different sizes/types)
- Item management (add/remove/move)
- Visual representation
- Drag-drop support

**Types**:
- Type 0: Loot box (7x8 grid)
- Type 1: Player backpack (variable size)
- Type 2: Ground container (15x8 grid)

#### 5. GridSystem (`core/GridSystem.ts`)

Grid-based inventory system:
- Cell-based item placement
- Collision detection
- Item rotation
- Visual feedback (hover, valid placement)

#### 6. DragDropSystem (`core/DragDropSystem.ts`)

Handles item dragging between grids:
- Mouse/touch input
- Grid snapping
- Transfer validation
- Visual preview

#### 7. Item (`entities/Item.ts`)

Represents a game item:
- Item data (from DataManager)
- Visual sprite (PixiJS)
- Grid position and size
- Metadata (objectID, name, price, grade)

### Component Hierarchy

```
PIXI.Application
└── Stage
    ├── Region (Player)
    │   └── Inventory
    │       └── Subgrid(s)
    │           └── Item(s)
    ├── Region (Spoils)
    │   ├── Inventory (Ground)
    │   ├── Inventory (Loot Box 1)
    │   ├── Inventory (Loot Box 2)
    │   └── Inventory (Loot Box 3)
    └── Region (Control Panel)
```

---

## Testing & Building

### Testing Workflows

Currently, the project uses **manual testing** with test data:

```typescript
// Game.ts - addTestItemsToInventory()
// Adds random items to containers for testing
this.addTestItemsToInventory(inventory, 10);
```

**Recommended additions** (not yet implemented):
- Unit tests with Jest/Vitest
- Integration tests for data loading
- E2E tests for Electron app

### Build Process

#### 1. TypeScript Compilation (Webpack)

```bash
npm run build:game
# Output: electron-app/dist/game.bundle.js
```

**Webpack config**:
- Entry: `src/game/main.ts`
- Output: `dist/game.bundle.js`
- Source maps: Enabled
- External: `pixi.js` (loaded from CDN/node_modules)

#### 2. Electron Packaging

```bash
npm run build
# Output: electron-app/dist/
```

**electron-builder config** (`package.json`):
- Target: Windows NSIS installer
- Product name: "DFData Manager"
- Icon: `assets/icon.ico` (not yet created)

### Environment-Specific Notes

#### Windows

- Use npm镜像 (npmmirror) for faster Electron downloads
- See `Windows打包说明.md` for detailed instructions
- Can create portable (no-install) versions

#### macOS/Linux

- Standard Electron packaging should work
- May need to adjust `package.json` build targets

### CI/CD Automation

The project includes GitHub Actions workflows for automated building and releasing.

#### Workflow: build-release.yml

**Location**: `.github/workflows/build-release.yml`

**Triggers**:
- Push version tags (e.g., `v1.0.0`)
- Push to `main`/`master` branches
- Pull requests to `main`/`master`
- Manual dispatch

**Build Matrix**:
- **Windows**: NSIS installer + ZIP
- **macOS**: DMG + ZIP
- **Linux**: AppImage + DEB + RPM

**Quick Release**:
```bash
# Create and push a version tag
git tag v1.0.0
git push origin v1.0.0

# Workflow will:
# 1. Build on all platforms
# 2. Create GitHub Release
# 3. Upload installers
```

**Documentation**: See `.github/workflows/README.md` for detailed usage

**Requirements**:
- Application icons in `electron-app/assets/` (see `electron-app/assets/README.md`)
- Proper version in `package.json`
- GitHub repo permissions for creating releases

---

## Common Tasks

### Adding a New Item Category

1. **Update data processing** (`process_props.py`):
   ```python
   new_category = []
   for item in props_data:
       if item.get('secondClass') == 'new_type':
           new_category.append(item)
   ```

2. **Create spec file**: `normalized_data/new_category_spec.json`

3. **Update catalog**: Add to `items_catalog.json`

4. **Update DataManager**: Add loading logic for new category

5. **Update UI**: Add menu item and view in Electron app

### Modifying Item Data

1. **Edit source file**: `normalized_data/*_spec.json`

2. **Update catalog if needed**: Ensure `items_catalog.json` is in sync

3. **Reload in app**: Use "加载数据" button to refresh

4. **Commit changes**: Only commit normalized JSON files, not raw data

### Adding a New UI Component

1. **Create component file**: `electron-app/src/game/components/NewComponent.ts`

2. **Extend base classes**: Use PIXI.Container or custom base

3. **Register in Game**: Add to appropriate Region

4. **Update layout**: Add responsive positioning in `config.ts`

### Updating TypeScript Definitions

1. **Edit types**: `electron-app/src/game/types/index.ts`

2. **Rebuild**: `npm run build:game`

3. **Check errors**: TypeScript compiler will validate

---

## Important Notes

### For AI Assistants

#### DO:

- ✅ **Follow TypeScript conventions**: Use path aliases, proper types
- ✅ **Maintain data schema**: Keep metadata structure consistent
- ✅ **Use console logging**: Include `[ClassName]` prefixes
- ✅ **Update catalog**: When modifying item data, update both spec files and catalog
- ✅ **Test with random items**: Use `getRandomItemWithPreset()` for testing
- ✅ **Check existing patterns**: Look at similar components before creating new ones
- ✅ **Respect .gitignore**: Don't commit raw data files, images, or temp files
- ✅ **Document changes**: Update this CLAUDE.md when making structural changes

#### DON'T:

- ❌ **Don't commit raw data**: Files like `price.json`, `data.json`, `武器.json` are gitignored
- ❌ **Don't commit images**: All image files are excluded from git
- ❌ **Don't commit generated docs**: README, ARCHITECTURE, TODO files are gitignored
- ❌ **Don't modify data directly**: Use `process_props.py` or edit normalized JSON
- ❌ **Don't break path aliases**: Maintain webpack and tsconfig sync
- ❌ **Don't use strict mode**: TypeScript is configured with `strict: false`
- ❌ **Don't add unnecessary dependencies**: Keep bundle size reasonable

### Data File Handling

**Committed to Git**:
- ✅ `normalized_data/*.json` (processed data)
- ✅ `electron-app/normalized_data/*.json` (copy for app)

**Not committed** (see `.gitignore`):
- ❌ Raw data files: `配件.json`, `武器.json`, `装备.json`, `price.json`, `data.json`
- ❌ Images: `*.png`, `*.jpg`, `images/`
- ❌ Reports: `*_report.txt`, `*.md` (except this file and user guides)
- ❌ Temporary: `*.tmp`, `*.log`, `nul`

### Chinese Language Support

This project uses **Chinese** (Simplified) for:
- User-facing text (UI labels, buttons)
- Comments in code (mixed Chinese/English)
- Documentation files (`使用指南.md`, `Windows打包说明.md`)

**AI assistants should**:
- Maintain Chinese text in UI components
- Use English for code comments when possible
- Keep existing language patterns in files

### Performance Considerations

- **slot_system.json is large** (1.7MB): Load asynchronously, don't block startup
- **Item sprites**: Use texture atlases when possible (not yet implemented)
- **Grid system**: Optimize collision detection for large inventories
- **Data loading**: Cache parsed JSON, don't re-parse on every access

### Known Limitations

1. **No automated tests**: Manual testing only
2. **No image assets**: Images loaded from URLs (may fail offline)
3. **No localization**: Chinese text hardcoded
4. **Limited error handling**: Some edge cases not covered
5. **No save system**: Game state not persisted
6. **Vue integration incomplete**: Package included but not fully used

### Future Enhancements (Recommended)

- [ ] Add unit tests (Jest/Vitest)
- [ ] Implement save/load system
- [ ] Add localization support (i18n)
- [ ] Create texture atlases for performance
- [ ] Add comprehensive error handling
- [ ] Implement undo/redo for data editing
- [ ] Add data validation schemas (JSON Schema)
- [ ] Create CI/CD pipeline
- [ ] Add automatic backups before save
- [ ] Implement real-time collaboration (optional)

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2025-12-06 | 1.0.0 | Initial CLAUDE.md creation |
| (future) | 1.1.0 | Add testing section, update architecture |

---

## Quick Reference

### Useful Commands

```bash
# Development
npm start                    # Start Electron app
npm run watch:game           # Watch TypeScript changes
npm run build:game           # Build game bundle

# Production
npm run build                # Package Electron app

# Data processing
python process_props.py      # Process raw data

# Debugging
# Open DevTools in Electron: Ctrl+Shift+I (Windows/Linux), Cmd+Option+I (macOS)
```

### File Locations

| What | Where |
|------|-------|
| Game entry point | `electron-app/src/game/main.ts` |
| Main game class | `electron-app/src/game/Game.ts` |
| Data manager | `electron-app/src/game/managers/DataManager.ts` |
| Type definitions | `electron-app/src/game/types/index.ts` |
| Game config | `electron-app/src/game/config.ts` |
| Item catalog | `normalized_data/items_catalog.json` |
| Weapon specs | `normalized_data/weapons_spec.json` |

### Key Constants

```typescript
// config.ts
GAME_WIDTH = 1600           // Canvas width
GAME_HEIGHT = 900           // Canvas height
GRID_CELL_SIZE = 50         // Size of one inventory grid cell
```

---

## Contact & Resources

- **Repository**: `/home/user/DFData`
- **Branch**: `claude/claude-md-miuqcy98wuxiwssh-01JBMwpZwa3mP29pws6HFarq`
- **Main branch**: (Not specified in current setup)

### Related Documentation

- `electron-app/使用指南.md` - User guide for the application
- `electron-app/Windows打包说明.md` - Windows packaging instructions
- `normalized_data/OPTIMIZATION_REPORT.md` - Data optimization notes

---

**End of CLAUDE.md**

*This document is maintained for AI assistants (Claude, etc.) to understand the codebase structure, conventions, and workflows. Please keep it updated when making significant architectural changes.*
