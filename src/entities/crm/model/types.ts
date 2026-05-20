import type {
  Customer as GenCustomer,
  CustomerInput as GenCustomerInput,
} from '../api/crmApi';

export type Customer = GenCustomer & {
  id: string;
  name: string;
  customer_name: string;
};

export type CustomerInput = GenCustomerInput;
