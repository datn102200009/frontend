import { masterDataApi } from '../../features/inventory/api/masterDataApi';
import { manufacturingApi } from '../../features/manufacturing/api/manufacturingApi';
import { inventoryApi } from '../../features/inventory/api/inventoryApi';

// ==========================================
// Caching Strategy for Master Data
// Metadata and dictionaries change rarely. Cache for 5 minutes.
// ==========================================
masterDataApi.enhanceEndpoints({
  endpoints: {
    getMasterDataWarehousesList: {
      keepUnusedDataFor: 300,
    },
    getMasterDataUomsList: {
      keepUnusedDataFor: 300,
    },
    getMasterDataItemsList: {
      keepUnusedDataFor: 300,
    },
  },
});

// ==========================================
// Caching Strategy for Transactional Data
// Work Orders and Stock Ledgers change often.
// keepUnusedDataFor: 0 ensures cache is cleared as soon as components unmount,
// so returning to the page will always fetch fresh data.
// ==========================================
manufacturingApi.enhanceEndpoints({
  endpoints: {
    getManufacturingWorkOrderList: {
      keepUnusedDataFor: 0,
    },
    getManufacturingBomList: {
      keepUnusedDataFor: 0,
    },
  },
});

inventoryApi.enhanceEndpoints({
  endpoints: {
    getInventoryStockEntryList: {
      keepUnusedDataFor: 0,
    },
    getInventoryStockLedgerBalance: {
      keepUnusedDataFor: 0,
    },
  },
});
