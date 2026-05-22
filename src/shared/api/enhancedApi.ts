import { masterDataApi } from '@features/inventory/api/masterDataApi';
import { manufacturingApi } from '@features/manufacturing/api/manufacturingApi';
import { inventoryApi } from '@features/inventory/api/inventoryApi';
import { purchasingApi } from '../../entities/purchasing/api/purchasingApi';
import { salesApi } from '../../entities/sales/api/salesApi';
import { financeApi } from '../../entities/finance/api/financeApi';
import { crmApi } from '../../entities/crm/api/crmApi';
import { procurementApi } from '../../entities/procurement/api/procurementApi';

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
// Setup automatic tag-based cache invalidation
// ==========================================

manufacturingApi.enhanceEndpoints({
  endpoints: {
    getManufacturingWorkOrderList: {
      providesTags: ['WorkOrders'],
    },
    getManufacturingBomList: {
      providesTags: ['Boms'],
    },
    postManufacturingWorkOrderCreate: {
      invalidatesTags: ['WorkOrders'],
    },
    postManufacturingWorkOrderByWorkOrderIdApprove: {
      invalidatesTags: ['WorkOrders', 'Inventory'],
    },
    postManufacturingWorkOrderByWorkOrderIdDeclare: {
      invalidatesTags: ['WorkOrders', 'Inventory'],
    },
    postManufacturingWorkOrderByWorkOrderIdComplete: {
      invalidatesTags: ['WorkOrders', 'Inventory'],
    },
    postManufacturingWorkOrderByWorkOrderIdCancel: {
      invalidatesTags: ['WorkOrders', 'Inventory'],
    },
    postManufacturingBomCreate: {
      invalidatesTags: ['Boms'],
    },
    putManufacturingBomByBomIdUpdate: {
      invalidatesTags: ['Boms'],
    },
    deleteManufacturingBomByBomIdDelete: {
      invalidatesTags: ['Boms'],
    },
  },
});

inventoryApi.enhanceEndpoints({
  endpoints: {
    getInventoryStockEntryList: {
      providesTags: ['Inventory'],
    },
    getInventoryStockLedgerBalance: {
      providesTags: ['Inventory'],
    },
    postInventoryStockInCreate: {
      invalidatesTags: ['Inventory'],
    },
    postInventoryStockInByStockEntryIdApprove: {
      invalidatesTags: ['Inventory', 'PurchaseOrders', 'Invoices'],
    },
    postInventoryStockIssueCreate: {
      invalidatesTags: ['Inventory'],
    },
    postInventoryStockIssueByStockEntryIdApprove: {
      invalidatesTags: ['Inventory', 'SalesOrders', 'Invoices'],
    },
    postInventoryStockTransferCreate: {
      invalidatesTags: ['Inventory'],
    },
    postInventoryStockTransferByStockEntryIdApprove: {
      invalidatesTags: ['Inventory'],
    },
    postInventoryStockEntryByStockEntryIdUpdate: {
      invalidatesTags: ['Inventory', 'PurchaseOrders', 'SalesOrders'],
    },
  },
});

purchasingApi.enhanceEndpoints({
  endpoints: {
    getPurchasingOrders: {
      providesTags: ['PurchaseOrders'],
    },
    getPurchasingInvoices: {
      providesTags: ['Invoices'],
    },
    getPurchasingOrdersByPk: {
      providesTags: ['PurchaseOrders'],
    },
    getPurchasingInvoicesByPk: {
      providesTags: ['Invoices'],
    },
    postPurchasingOrders: {
      invalidatesTags: ['PurchaseOrders'],
    },
    putPurchasingOrdersByPk: {
      invalidatesTags: ['PurchaseOrders'],
    },
    deletePurchasingOrdersByPk: {
      invalidatesTags: ['PurchaseOrders'],
    },
    postPurchasingOrdersByPkReceive: {
      invalidatesTags: ['PurchaseOrders', 'Invoices', 'Inventory'],
    },
    postPurchasingOrdersByPkApprove: {
      invalidatesTags: ['PurchaseOrders', 'Inventory', 'Invoices'],
    },
  },
});

salesApi.enhanceEndpoints({
  endpoints: {
    getSalesOrders: {
      providesTags: ['SalesOrders'],
    },
    getSalesInvoices: {
      providesTags: ['Invoices'],
    },
    getSalesOrdersByPk: {
      providesTags: ['SalesOrders'],
    },
    getSalesInvoicesByPk: {
      providesTags: ['Invoices'],
    },
    postSalesOrders: {
      invalidatesTags: ['SalesOrders'],
    },
    putSalesOrdersByPk: {
      invalidatesTags: ['SalesOrders'],
    },
    deleteSalesOrdersByPk: {
      invalidatesTags: ['SalesOrders'],
    },
    postSalesOrdersByPkDeliver: {
      invalidatesTags: ['SalesOrders', 'Invoices', 'Inventory'],
    },
    postSalesOrdersByPkApprove: {
      invalidatesTags: ['SalesOrders', 'Inventory', 'Invoices'],
    },
  },
});

financeApi.enhanceEndpoints({
  endpoints: {
    getFinanceCashFlows: {
      providesTags: ['CashFlows'],
    },
    getFinanceCashFlowsByPk: {
      providesTags: ['CashFlows'],
    },
    postFinanceCashFlows: {
      invalidatesTags: ['CashFlows', 'Invoices', 'PurchaseOrders', 'SalesOrders'],
    },
  },
});

crmApi.enhanceEndpoints({
  endpoints: {
    getCrmCustomers: {
      providesTags: ['Customers'],
    },
    getCrmCustomersByCustomerId: {
      providesTags: ['Customers'],
    },
    postCrmCustomers: {
      invalidatesTags: ['Customers'],
    },
    putCrmCustomersByCustomerId: {
      invalidatesTags: ['Customers'],
    },
    deleteCrmCustomersByCustomerId: {
      invalidatesTags: ['Customers'],
    },
  },
});

procurementApi.enhanceEndpoints({
  endpoints: {
    getProcurementSuppliers: {
      providesTags: ['Suppliers'],
    },
    getProcurementSuppliersBySupplierId: {
      providesTags: ['Suppliers'],
    },
    postProcurementSuppliers: {
      invalidatesTags: ['Suppliers'],
    },
    putProcurementSuppliersBySupplierId: {
      invalidatesTags: ['Suppliers'],
    },
    deleteProcurementSuppliersBySupplierId: {
      invalidatesTags: ['Suppliers'],
    },
  },
});
