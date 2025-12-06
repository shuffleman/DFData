const { createApp } = Vue;

createApp({
  data() {
    return {
      // 数据状态
      dataLoaded: false,
      loading: false,
      loadingMessage: '',
      dataPath: '',

      // 数据存储
      itemsCatalog: {},
      weaponsData: [],
      accessoriesData: [],
      ammunitionsData: [],
      protectionData: {},
      slotSystemData: {},
      collectiblesData: [],
      consumablesData: [],

      // UI 状态
      currentView: 'weapons',
      searchQuery: '',
      filterType: '',
      filterProtectionType: '',
      showEditDialog: false,
      editingItem: {},
      showPreviewDialog: false,
      previewingItem: {},

      // 图片缓存
      imageCache: {},

      // 插槽测试器状态
      slotTesterActive: false,
      selectedWeaponId: null,
      installedAccessories: {}, // { slotId: accessoryId }
      currentSlots: [],
      activeSlotMenu: null, // 当前激活的插槽菜单

      // 统计数据
      weaponTypeChart: null,
      accessoryTypeChart: null
    };
  },

  computed: {
    // 武器数量
    weaponsCount() {
      return this.weaponsData.length;
    },

    // 配件数量
    accessoriesCount() {
      return this.accessoriesData.length;
    },

    // 弹药数量
    ammunitionsCount() {
      return this.ammunitionsData.length;
    },

    // 防护装备数量
    protectionCount() {
      const p = this.protectionData;
      return (p.helmets?.length || 0) + (p.armors?.length || 0) +
             (p.chests?.length || 0) + (p.backpacks?.length || 0);
    },

    // 收集品数量
    collectiblesCount() {
      return this.collectiblesData.length;
    },

    // 消耗品数量
    consumablesCount() {
      return this.consumablesData.length;
    },

    // 总物品数
    totalItems() {
      return Object.keys(this.itemsCatalog).length;
    },

    // 配件类型列表
    accessoryTypes() {
      const types = new Set();
      this.accessoriesData.forEach(item => {
        if (item.type) types.add(item.type);
      });
      return Array.from(types).sort();
    },

    // 过滤后的武器列表
    filteredWeapons() {
      let weapons = this.weaponsData;

      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        weapons = weapons.filter(w =>
          w.objectName?.toLowerCase().includes(query) ||
          w.type?.toLowerCase().includes(query) ||
          String(w.objectID).includes(query)
        );
      }

      return weapons;
    },

    // 过滤后的配件列表
    filteredAccessories() {
      let accessories = this.accessoriesData;

      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        accessories = accessories.filter(a =>
          a.objectName?.toLowerCase().includes(query) ||
          a.type?.toLowerCase().includes(query) ||
          String(a.objectID).includes(query)
        );
      }

      if (this.filterType) {
        accessories = accessories.filter(a => a.type === this.filterType);
      }

      return accessories;
    },

    // 价格统计
    maxPrice() {
      const prices = Object.values(this.itemsCatalog)
        .map(item => item.avgPrice)
        .filter(price => price != null);
      return prices.length > 0 ? Math.max(...prices) : 0;
    },

    avgPrice() {
      const prices = Object.values(this.itemsCatalog)
        .map(item => item.avgPrice)
        .filter(price => price != null);
      if (prices.length === 0) return 0;
      return Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    },

    medianPrice() {
      const prices = Object.values(this.itemsCatalog)
        .map(item => item.avgPrice)
        .filter(price => price != null)
        .sort((a, b) => a - b);
      if (prices.length === 0) return 0;
      const mid = Math.floor(prices.length / 2);
      return prices.length % 2 === 0
        ? Math.round((prices[mid - 1] + prices[mid]) / 2)
        : prices[mid];
    },

    // 过滤后的弹药列表
    filteredAmmunitions() {
      let ammunitions = this.ammunitionsData;

      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        ammunitions = ammunitions.filter(a =>
          a.objectName?.toLowerCase().includes(query) ||
          a.caliber?.toLowerCase().includes(query) ||
          String(a.objectID).includes(query)
        );
      }

      return ammunitions;
    },

    // 合并所有防护装备
    allProtectionItems() {
      const items = [];
      const p = this.protectionData;

      if (p.helmets) {
        items.push(...p.helmets.map(item => ({ ...item, protectionType: '头盔' })));
      }
      if (p.armors) {
        items.push(...p.armors.map(item => ({ ...item, protectionType: '护甲' })));
      }
      if (p.chests) {
        items.push(...p.chests.map(item => ({ ...item, protectionType: '胸挂' })));
      }
      if (p.backpacks) {
        items.push(...p.backpacks.map(item => ({ ...item, protectionType: '背包' })));
      }

      return items;
    },

    // 过滤后的防护装备列表
    filteredProtection() {
      let items = this.allProtectionItems;

      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        items = items.filter(item =>
          item.objectName?.toLowerCase().includes(query) ||
          item.protectionType?.toLowerCase().includes(query) ||
          String(item.objectID).includes(query)
        );
      }

      if (this.filterProtectionType) {
        items = items.filter(item => {
          const typeMap = {
            'helmets': '头盔',
            'armors': '护甲',
            'chests': '胸挂',
            'backpacks': '背包'
          };
          return item.protectionType === typeMap[this.filterProtectionType];
        });
      }

      return items;
    },

    // 过滤后的收集品列表
    filteredCollectibles() {
      let collectibles = this.collectiblesData;

      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        collectibles = collectibles.filter(item =>
          item.objectName?.toLowerCase().includes(query) ||
          item.type?.toLowerCase().includes(query) ||
          String(item.objectID).includes(query)
        );
      }

      return collectibles;
    },

    // 过滤后的消耗品列表
    filteredConsumables() {
      let consumables = this.consumablesData;

      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        consumables = consumables.filter(item =>
          item.objectName?.toLowerCase().includes(query) ||
          item.thirdClassCN?.toLowerCase().includes(query) ||
          String(item.objectID).includes(query)
        );
      }

      return consumables;
    },

    // 插槽系统统计
    slotTypesCount() {
      if (!this.slotSystemData.slotTypes) return 0;
      return Object.keys(this.slotSystemData.slotTypes).length;
    },

    weaponSlotsCount() {
      if (!this.slotSystemData.weaponSlots) return 0;
      return Object.keys(this.slotSystemData.weaponSlots).length;
    },

    compatibilityCount() {
      if (!this.slotSystemData.compatibility) return 0;
      let count = 0;
      Object.values(this.slotSystemData.compatibility).forEach(slots => {
        if (slots && typeof slots === 'object') {
          Object.values(slots).forEach(items => {
            if (Array.isArray(items)) count += items.length;
          });
        }
      });
      return count;
    },

    // 插槽测试器计算属性
    selectedWeapon() {
      if (!this.selectedWeaponId) return null;
      return this.weaponsData.find(w => w.objectID === this.selectedWeaponId);
    },

    weaponBaseSlots() {
      if (!this.selectedWeaponId || !this.slotSystemData.weaponSlots) return [];
      const selectedWeaponIdStr = String(this.selectedWeaponId);
      return this.slotSystemData.weaponSlots
        .filter(slot => String(slot.weaponId) === selectedWeaponIdStr)
        .map(slot => ({
          ...slot,
          isDynamic: false  // 基础插槽明确标记为非动态
        }))
        .sort((a, b) => a.slotOrder - b.slotOrder);
    },

    availableSlots() {
      // 基础插槽 + 动态添加的插槽 - 动态移除的插槽
      let slots = [...this.weaponBaseSlots];

      // 应用动态插槽效果
      Object.entries(this.installedAccessories).forEach(([slotId, accessoryId]) => {
        const dynamicEffects = this.getAccessoryDynamicSlots(accessoryId);

        dynamicEffects.forEach(effect => {
          if (effect.action === 'add') {
            // 添加新插槽
            slots.push({
              weaponId: this.selectedWeaponId,
              weaponName: this.selectedWeapon?.objectName,
              slotId: effect.slotId,
              slotName: effect.slotName,
              slotType: effect.slotType,
              unlock: effect.unlock,
              slotOrder: 999, // 动态插槽排在最后
              isDynamic: true,
              source: accessoryId
            });
          } else if (effect.action === 'remove') {
            // 移除插槽
            slots = slots.filter(s => s.slotId !== effect.slotId);
          }
        });
      });

      return slots;
    },

    slotAccessories() {
      // 返回每个插槽可用的配件列表
      if (!this.selectedWeaponId || !this.slotSystemData.slotAccessories) return {};

      const result = {};
      const selectedWeaponIdStr = String(this.selectedWeaponId);

      this.availableSlots.forEach(slot => {
        const compatibleAccessories = this.slotSystemData.slotAccessories
          .filter(sa => String(sa.weaponId) === selectedWeaponIdStr && sa.slotId === slot.slotId)
          .map(sa => ({
            ...sa,
            accessoryData: this.accessoriesData.find(a => a.objectID === sa.accessoryId) || {}
          }));

        result[slot.slotId] = compatibleAccessories;
      });

      return result;
    }
  },

  methods: {
    // 打开游戏
    openGame() {
      window.electronAPI.openGame();
    },

    // 加载数据
    async loadData() {
      try {
        this.loading = true;
        this.loadingMessage = '正在选择数据目录...';

        // 让用户选择数据目录
        const result = await window.electronAPI.selectFile({
          title: '选择数据目录',
          properties: ['openDirectory']
        });

        if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
          this.loading = false;
          return;
        }

        const dataDir = result.filePaths[0];
        this.dataPath = dataDir;

        // 加载物品目录
        this.loadingMessage = '正在加载物品目录...';
        const catalogResult = await window.electronAPI.loadDataFile(
          dataDir + '/items_catalog.json'
        );

        if (catalogResult.success) {
          this.itemsCatalog = catalogResult.data.items || {};
        }

        // 加载武器数据
        this.loadingMessage = '正在加载武器数据...';
        const weaponsResult = await window.electronAPI.loadDataFile(
          dataDir + '/weapons_spec.json'
        );

        if (weaponsResult.success) {
          const weaponSpecs = weaponsResult.data.items || [];
          // 合并武器专业属性和基础信息
          this.weaponsData = weaponSpecs.map(weapon => ({
            ...weapon,
            ...this.itemsCatalog[weapon.objectID]
          }));
        }

        // 加载配件数据
        this.loadingMessage = '正在加载配件数据...';
        const accessoriesResult = await window.electronAPI.loadDataFile(
          dataDir + '/accessories_spec.json'
        );

        if (accessoriesResult.success) {
          const accessorySpecs = accessoriesResult.data.items || [];
          this.accessoriesData = accessorySpecs.map(acc => ({
            ...acc,
            ...this.itemsCatalog[acc.objectID]
          }));
        }

        // 加载弹药数据
        this.loadingMessage = '正在加载弹药数据...';
        const ammoResult = await window.electronAPI.loadDataFile(
          dataDir + '/ammunitions_spec.json'
        );

        if (ammoResult.success) {
          const ammoSpecs = ammoResult.data.items || [];
          this.ammunitionsData = ammoSpecs.map(ammo => ({
            ...ammo,
            ...this.itemsCatalog[ammo.objectID]
          }));
        }

        // 加载防护装备数据
        this.loadingMessage = '正在加载防护装备数据...';
        const protectionResult = await window.electronAPI.loadDataFile(
          dataDir + '/protection_spec.json'
        );

        if (protectionResult.success) {
          const protectionData = protectionResult.data;

          // 合并 catalog 信息到每个防护装备
          ['helmets', 'armors', 'chests', 'backpacks'].forEach(category => {
            if (protectionData[category]) {
              protectionData[category] = protectionData[category].map(item => ({
                ...item,
                ...this.itemsCatalog[item.objectID],
                category: category.slice(0, -1) // 去掉复数形式的 's'
              }));
            }
          });

          this.protectionData = protectionData;
        }

        // 加载插槽系统数据
        this.loadingMessage = '正在加载插槽系统数据...';
        const slotResult = await window.electronAPI.loadDataFile(
          dataDir + '/slot_system.json'
        );

        if (slotResult.success) {
          this.slotSystemData = slotResult.data;
        }

        // 加载收集品数据
        this.loadingMessage = '正在加载收集品数据...';
        const collectiblesResult = await window.electronAPI.loadDataFile(
          dataDir + '/collectibles_spec.json'
        );

        if (collectiblesResult.success) {
          const collectiblesSpecs = collectiblesResult.data.items || [];
          this.collectiblesData = collectiblesSpecs.map(item => ({
            ...item,
            ...this.itemsCatalog[item.objectID]
          }));
        }

        // 加载消耗品数据
        this.loadingMessage = '正在加载消耗品数据...';
        const consumablesResult = await window.electronAPI.loadDataFile(
          dataDir + '/consumables_spec.json'
        );

        if (consumablesResult.success) {
          const consumablesSpecs = consumablesResult.data.items || [];
          this.consumablesData = consumablesSpecs.map(item => ({
            ...item,
            ...this.itemsCatalog[item.objectID]
          }));
        }

        this.dataLoaded = true;
        this.loading = false;
        this.loadingMessage = '';

        // 如果在统计页面，重新渲染图表
        if (this.currentView === 'statistics') {
          this.$nextTick(() => {
            this.renderCharts();
          });
        }

      } catch (error) {
        console.error('加载数据失败:', error);
        alert('加载数据失败: ' + error.message);
        this.loading = false;
      }
    },

    // 保存数据
    async saveData() {
      if (!this.dataPath) {
        alert('请先加载数据');
        return;
      }

      try {
        this.loading = true;
        this.loadingMessage = '正在保存数据...';

        // 保存物品目录
        await window.electronAPI.saveDataFile(
          this.dataPath + '/items_catalog.json',
          { metadata: {}, items: this.itemsCatalog }
        );

        // 保存武器数据
        const weaponSpecs = this.weaponsData.map(({ objectName, picture, avgPrice, ...spec }) => spec);
        await window.electronAPI.saveDataFile(
          this.dataPath + '/weapons_spec.json',
          { metadata: {}, items: weaponSpecs }
        );

        // 保存配件数据
        const accessorySpecs = this.accessoriesData.map(({ objectName, picture, avgPrice, ...spec }) => spec);
        await window.electronAPI.saveDataFile(
          this.dataPath + '/accessories_spec.json',
          { metadata: {}, items: accessorySpecs }
        );

        this.loading = false;
        alert('数据保存成功！');

      } catch (error) {
        console.error('保存数据失败:', error);
        alert('保存数据失败: ' + error.message);
        this.loading = false;
      }
    },

    // 添加新物品
    addNewItem(type) {
      this.editingItem = {
        id: null,
        objectID: null,
        objectName: '',
        type: type,
        avgPrice: 0,
        grade: 0,
        picture: '',
        category: type
      };
      this.showEditDialog = true;
    },

    // 编辑物品
    editItem(item) {
      this.editingItem = { ...item };
      this.showEditDialog = true;
    },

    // 保存编辑的物品
    saveEditedItem() {
      const objectID = String(this.editingItem.objectID);

      // 更新物品目录
      this.itemsCatalog[objectID] = {
        id: this.editingItem.id,
        objectID: this.editingItem.objectID,
        category: this.editingItem.category,
        objectName: this.editingItem.objectName,
        avgPrice: this.editingItem.avgPrice,
        grade: this.editingItem.grade,
        picture: this.editingItem.picture
      };

      // 更新对应的数据列表
      if (this.currentView === 'weapons') {
        const index = this.weaponsData.findIndex(w => w.objectID === this.editingItem.objectID);
        if (index !== -1) {
          this.weaponsData[index] = { ...this.editingItem };
        } else {
          this.weaponsData.push({ ...this.editingItem });
        }
      } else if (this.currentView === 'accessories') {
        const index = this.accessoriesData.findIndex(a => a.objectID === this.editingItem.objectID);
        if (index !== -1) {
          this.accessoriesData[index] = { ...this.editingItem };
        } else {
          this.accessoriesData.push({ ...this.editingItem });
        }
      }

      this.closeEditDialog();
    },

    // 删除物品
    deleteItem(item) {
      if (!confirm(`确定要删除 "${item.objectName}" 吗？`)) {
        return;
      }

      const objectID = String(item.objectID);
      delete this.itemsCatalog[objectID];

      if (this.currentView === 'weapons') {
        this.weaponsData = this.weaponsData.filter(w => w.objectID !== item.objectID);
      } else if (this.currentView === 'accessories') {
        this.accessoriesData = this.accessoriesData.filter(a => a.objectID !== item.objectID);
      }
    },

    // 关闭编辑对话框
    closeEditDialog() {
      this.showEditDialog = false;
      this.editingItem = {};
    },

    // 获取物品类别对应的图片文件夹
    getItemCategory(item) {
      const category = item.category?.toLowerCase();
      if (category === 'weapon') return 'weapons';
      if (category === 'accessory') return 'accessories';
      if (category === 'ammunition') return 'ammunitions';
      if (category === 'helmet') return 'helmets';
      if (category === 'armor') return 'armors';
      if (category === 'chest') return 'chests';
      if (category === 'backpack') return 'backpacks';
      if (category === 'collectible') return 'collectibles';
      if (category === 'consumable') return 'consumables';
      return 'accessories'; // 默认
    },

    // 获取本地图片路径
    getLocalImagePath(item) {
      if (!this.dataPath || !item.objectID) return null;
      const category = this.getItemCategory(item);
      return `${this.dataPath}/images/${category}/${item.objectID}.png`;
    },

    // 加载物品图片（带缓存）
    async loadItemImage(item) {
      const objectID = String(item.objectID);

      // 检查缓存
      if (this.imageCache[objectID]) {
        return this.imageCache[objectID];
      }

      // 获取本地路径
      const imagePath = this.getLocalImagePath(item);
      if (!imagePath) return null;

      try {
        const result = await window.electronAPI.loadLocalImage(imagePath);
        if (result.success) {
          this.imageCache[objectID] = result.data;
          return result.data;
        }
      } catch (error) {
        console.error('加载图片失败:', error);
      }
      return null;
    },

    // 预览物品
    async previewItem(item) {
      this.previewingItem = { ...item };

      // 加载高清图片
      if (!this.previewingItem.imageData) {
        const imageData = await this.loadItemImage(item);
        if (imageData) {
          this.previewingItem.imageData = imageData;
        }
      }

      this.showPreviewDialog = true;
    },

    // 关闭预览对话框
    closePreviewDialog() {
      this.showPreviewDialog = false;
      this.previewingItem = {};
    },

    // 渲染图表
    renderCharts() {
      // 武器类型分布图
      const weaponTypes = {};
      this.weaponsData.forEach(w => {
        weaponTypes[w.type] = (weaponTypes[w.type] || 0) + 1;
      });

      if (this.weaponTypeChart) {
        this.weaponTypeChart.destroy();
      }

      const weaponCtx = document.getElementById('weaponTypeChart');
      if (weaponCtx) {
        this.weaponTypeChart = new Chart(weaponCtx, {
          type: 'doughnut',
          data: {
            labels: Object.keys(weaponTypes),
            datasets: [{
              data: Object.values(weaponTypes),
              backgroundColor: [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
              ]
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true
          }
        });
      }

      // 配件类型分布图
      const accessoryTypes = {};
      this.accessoriesData.forEach(a => {
        accessoryTypes[a.type] = (accessoryTypes[a.type] || 0) + 1;
      });

      if (this.accessoryTypeChart) {
        this.accessoryTypeChart.destroy();
      }

      const accessoryCtx = document.getElementById('accessoryTypeChart');
      if (accessoryCtx) {
        this.accessoryTypeChart = new Chart(accessoryCtx, {
          type: 'bar',
          data: {
            labels: Object.keys(accessoryTypes),
            datasets: [{
              label: '数量',
              data: Object.values(accessoryTypes),
              backgroundColor: '#36A2EB'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
      }
    },

    // 插槽测试器方法
    openSlotTester() {
      this.slotTesterActive = true;
      this.selectedWeaponId = null;
      this.installedAccessories = {};
      this.currentSlots = [];
    },

    closeSlotTester() {
      this.slotTesterActive = false;
      this.selectedWeaponId = null;
      this.installedAccessories = {};
      this.currentSlots = [];
    },

    selectWeaponForTester(weaponId) {
      this.selectedWeaponId = weaponId;
      this.installedAccessories = {};
    },

    getAccessoryDynamicSlots(accessoryId) {
      if (!this.slotSystemData.accessoryDynamicSlots) return [];
      return this.slotSystemData.accessoryDynamicSlots.filter(
        ds => ds.accessoryId === accessoryId
      );
    },

    installAccessory(slotId, accessoryId) {
      // 安装配件到插槽
      this.installedAccessories[slotId] = accessoryId;
    },

    installAccessoryAndCloseMenu(slotId, accessoryId) {
      this.installAccessory(slotId, accessoryId);
      this.activeSlotMenu = null;
    },

    uninstallAccessory(slotId) {
      // 卸载插槽上的配件
      delete this.installedAccessories[slotId];
    },

    getInstalledAccessory(slotId) {
      const accessoryId = this.installedAccessories[slotId];
      if (!accessoryId) return null;
      return this.accessoriesData.find(a => a.objectID === accessoryId);
    },

    getDynamicSlotInfo(slot) {
      // 获取动态插槽的来源配件信息
      if (!slot.isDynamic || !slot.source) return null;
      const accessory = this.accessoriesData.find(a => a.objectID === slot.source);
      return accessory;
    },

    toggleSlotMenu(slotId) {
      // 切换插槽菜单的显示状态
      if (this.activeSlotMenu === slotId) {
        this.activeSlotMenu = null;
      } else {
        this.activeSlotMenu = slotId;
      }
    },

    // 计算背包/胸挂的格子布局
    calculateGridLayout(item) {
      if (!item.grid || !Array.isArray(item.grid)) return { cells: [], gridWidth: 0, gridHeight: 0 };

      /**
       * 布局规则：
       * - column 相同的格子在同一列（X相同，垂直堆叠，Y递增）
       * - column 不同的格子在不同列（水平排列，X递增）
       * - subColumn 相同的格子在同一行（Y相同，水平排列，X递增）
       * - subColumn 不同的格子在同一主列内垂直堆叠（Y递增）
       */

      // 按column分组
      const columnGroups = {};
      let autoSubColumnCounter = {}; // 为没有subColumn的格子自动分配唯一的subColumn

      item.grid.forEach((gridItem, index) => {
        const col = gridItem.column || 1;
        if (!columnGroups[col]) {
          columnGroups[col] = {};
          autoSubColumnCounter[col] = 10000; // 使用一个大数字作为起始值，避免与真实subColumn冲突
        }

        // 如果没有subColumn，给每个格子分配唯一的subColumn（实现垂直堆叠）
        let subCol;
        if (gridItem.subColumn !== undefined) {
          subCol = gridItem.subColumn;
        } else {
          subCol = autoSubColumnCounter[col]++;
        }

        if (!columnGroups[col][subCol]) {
          columnGroups[col][subCol] = [];
        }

        columnGroups[col][subCol].push({ ...gridItem, index });
      });

      // 计算布局
      const cells = [];
      let globalX = 0; // 当前column的起始X坐标
      let globalMaxHeight = 0;

      // 按column排序
      const columns = Object.keys(columnGroups).sort((a, b) => parseInt(a) - parseInt(b));

      columns.forEach(colKey => {
        const subColumnGroups = columnGroups[colKey];
        let currentY = 0; // 当前column内的Y坐标
        let columnMaxWidth = 0; // 当前column的最大宽度

        // 按subColumn排序（noSub在最前）
        const subColumns = Object.keys(subColumnGroups).sort((a, b) => {
          if (a === 'noSub') return -1;
          if (b === 'noSub') return 1;
          return parseInt(a) - parseInt(b);
        });

        subColumns.forEach(subColKey => {
          const items = subColumnGroups[subColKey];
          let currentX = globalX; // 当前subColumn内的X坐标
          let rowHeight = 0; // 当前行的最大高度

          // 同一subColumn的格子在同一行水平排列
          items.forEach(gridItem => {
            if (!gridItem.grid.hidden) {
              cells.push({
                x: currentX,
                y: currentY,
                width: gridItem.grid.X,
                height: gridItem.grid.Y,
                index: gridItem.index
              });

              currentX += gridItem.grid.X;
              rowHeight = Math.max(rowHeight, gridItem.grid.Y);
            }
          });

          // 更新column的最大宽度
          columnMaxWidth = Math.max(columnMaxWidth, currentX - globalX);

          // 移动到下一行
          currentY += rowHeight;
        });

        // 更新全局最大高度
        globalMaxHeight = Math.max(globalMaxHeight, currentY);

        // 移动到下一列
        globalX += columnMaxWidth;
      });

      return {
        cells,
        gridWidth: globalX,
        gridHeight: globalMaxHeight
      };
    }
  },

  watch: {
    currentView(newView) {
      if (newView === 'statistics' && this.dataLoaded) {
        this.$nextTick(() => {
          this.renderCharts();
        });
      }
    }
  },

  mounted() {
    console.log('DFData Manager 已启动');
  }
}).mount('#app');
