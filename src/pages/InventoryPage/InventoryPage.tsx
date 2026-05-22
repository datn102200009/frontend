import { useState } from 'react';
import { ProductList } from '@features/inventory/ui/ProductList';
import { StockEntryList } from '@features/inventory/ui/StockEntryList';
import { StockLedgerView } from '@features/inventory/ui/StockLedgerView';
import styles from '@pages/BomPage/BomPage.module.css';
import clsx from 'clsx';

type Tab = 'products' | 'entries' | 'ledger';

export default function InventoryPage() {
  const [tab, setTab] = useState<Tab>('products');

  return (
    <div className={styles.page}>
      <div className={styles.tabs} role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'products'}
          className={clsx(styles.tab, tab === 'products' && styles.active)}
          onClick={() => setTab('products')}>
          Sản Phẩm
        </button>
        <button type="button" role="tab" aria-selected={tab === 'entries'}
          className={clsx(styles.tab, tab === 'entries' && styles.active)}
          onClick={() => setTab('entries')}>
          Phiếu Kho
        </button>
        <button type="button" role="tab" aria-selected={tab === 'ledger'}
          className={clsx(styles.tab, tab === 'ledger' && styles.active)}
          onClick={() => setTab('ledger')}>
          Tồn Kho
        </button>
      </div>
      <div className={styles.content}>
        {tab === 'products' && <ProductList />}
        {tab === 'entries' && <StockEntryList />}
        {tab === 'ledger' && <StockLedgerView />}
      </div>
    </div>
  );
}
