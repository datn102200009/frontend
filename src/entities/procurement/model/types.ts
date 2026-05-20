import type {
  Supplier as GenSupplier,
  SupplierInput as GenSupplierInput,
} from '../api/procurementApi';

export type Supplier = GenSupplier & {
  id: string;
  name: string;
  supplier_name: string;
};

export type SupplierInput = GenSupplierInput;
