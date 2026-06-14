import { masterDataApi } from '@features/inventory/api/masterDataApi';
import { manufacturingApi } from '@features/manufacturing/api/manufacturingApi';
import { inventoryApi } from '@features/inventory/api/inventoryApi';
import { purchasingApi } from '@entities/purchasing/api/purchasingApi';
import { salesApi } from '@entities/sales/api/salesApi';
import { financeApi } from '@entities/finance/api/financeApi';
import { crmApi } from '@entities/crm/api/crmApi';
import { procurementApi } from '@entities/procurement/api/procurementApi';
import { hrmApi } from '@entities/hrm/api/hrmApi';

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
    getPurchasingOrdersByPk: {
      providesTags: ['PurchaseOrders'],
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
    postPurchasingOrdersByPkCancel: {
      invalidatesTags: ['PurchaseOrders', 'Invoices', 'Inventory', 'CashFlows'],
    },
  },
});

salesApi.enhanceEndpoints({
  endpoints: {
    getSalesOrders: {
      providesTags: ['SalesOrders'],
    },
    getSalesOrdersByPk: {
      providesTags: ['SalesOrders'],
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
    postSalesOrdersByPkApproveCreditBypass: {
      invalidatesTags: ['SalesOrders', 'Inventory', 'Invoices'],
    },
    postSalesOrdersByPkCancel: {
      invalidatesTags: ['SalesOrders', 'Invoices', 'Inventory', 'CashFlows'],
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
    getFinanceInvoicesPurchase: {
      providesTags: ['Invoices'],
    },
    getFinanceInvoicesPurchaseByPk: {
      providesTags: ['Invoices'],
    },
    postFinanceInvoicesPurchaseByPkPay: {
      invalidatesTags: ['Invoices', 'PurchaseOrders', 'CashFlows'],
    },
    getFinanceInvoicesSales: {
      providesTags: ['Invoices'],
    },
    getFinanceInvoicesSalesByPk: {
      providesTags: ['Invoices'],
    },
    postFinanceInvoicesSalesByPkCollect: {
      invalidatesTags: ['Invoices', 'SalesOrders', 'CashFlows'],
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

// ==========================================
// Caching Strategy for HRM Data
// ==========================================
hrmApi.enhanceEndpoints({
  endpoints: {
    getHrmEmployees: {
      providesTags: ['Employees'],
    },
    getHrmEmployeesById: {
      providesTags: (_result, _error, arg) => [{ type: 'Employees' as const, id: arg.id }],
    },
    postHrmEmployeesCreate: {
      invalidatesTags: ['Employees'],
    },
    patchHrmEmployeesByIdUpdate: {
      invalidatesTags: (_result, _error, arg) => ['Employees', { type: 'Employees' as const, id: arg.id }],
    },
    postHrmEmployeesByIdUpdateSalaryTitle: {
      invalidatesTags: (_result, _error, arg) => ['Employees', { type: 'Employees' as const, id: arg.id }],
    },
    postHrmContracts: {
      invalidatesTags: ['Employees'],
    },
    postHrmContractsByIdTerminate: {
      invalidatesTags: ['Employees', 'SalarySlips', 'CashFlows'],
    },
    getHrmAttendances: {
      providesTags: ['Attendances'],
    },
    postHrmAttendancesBatch: {
      invalidatesTags: ['Attendances', 'SalarySlips'],
    },
    getHrmLeaveRequests: {
      providesTags: ['LeaveRequests'],
    },
    postHrmLeaveRequestsCreate: {
      invalidatesTags: ['LeaveRequests'],
    },
    postHrmLeaveRequestsByIdApprove: {
      invalidatesTags: ['LeaveRequests', 'Attendances'],
    },
    getHrmSalarySlips: {
      providesTags: ['SalarySlips'],
    },
    postHrmSalarySlipsInitialize: {
      invalidatesTags: ['SalarySlips'],
    },
    postHrmSalarySlipsByIdCalculate: {
      invalidatesTags: ['SalarySlips'],
    },
    postHrmSalarySlipsBulkConfirmPay: {
      invalidatesTags: ['SalarySlips', 'CashFlows'],
    },
    getHrmRewards: {
      providesTags: ['Rewards'],
    },
    getHrmDisciplines: {
      providesTags: ['Disciplines'],
    },
    postHrmRewards: {
      invalidatesTags: ['Rewards', 'Employees', 'SalarySlips'],
    },
    postHrmRewardsByIdApprove: {
      invalidatesTags: ['Rewards', 'Employees', 'SalarySlips'],
    },
    postHrmDisciplines: {
      invalidatesTags: ['Disciplines', 'Employees', 'SalarySlips'],
    },
    postHrmDisciplinesByIdApprove: {
      invalidatesTags: ['Disciplines', 'Employees', 'SalarySlips'],
    },
    getHrmPublicHolidays: {
      providesTags: ['PublicHolidays'],
    },
    getHrmPublicHolidaysById: {
      providesTags: (_result, _error, arg) => [{ type: 'PublicHolidays' as const, id: arg.id }],
    },
    postHrmPublicHolidays: {
      invalidatesTags: ['PublicHolidays'],
    },
    putHrmPublicHolidaysById: {
      invalidatesTags: (_result, _error, arg) => ['PublicHolidays', { type: 'PublicHolidays' as const, id: arg.id }],
    },
    patchHrmPublicHolidaysById: {
      invalidatesTags: (_result, _error, arg) => ['PublicHolidays', { type: 'PublicHolidays' as const, id: arg.id }],
    },
    deleteHrmPublicHolidaysById: {
      invalidatesTags: ['PublicHolidays'],
    },
  },
});
