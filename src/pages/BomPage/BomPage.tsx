import { useSearchParams } from 'react-router-dom';
import { BomList } from '@features/bom/ui/BomList';
import { WorkOrderList } from '@features/bom/ui/WorkOrderList';
import styles from './BomPage.module.css';
import clsx from 'clsx';

type Tab = 'bom' | 'wo';

export default function BomPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') || 'bom') as Tab;

  const setTab = (newTab: Tab) => {
    setSearchParams({ tab: newTab });
  };

  return (
    <div className={styles.page}>
      <div className={styles.tabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'bom'}
          className={clsx(styles.tab, tab === 'bom' && styles.active)}
          onClick={() => setTab('bom')}
        >
          Định Mức BOM
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'wo'}
          className={clsx(styles.tab, tab === 'wo' && styles.active)}
          onClick={() => setTab('wo')}
        >
          Lệnh Sản Xuất
        </button>
      </div>
      <div className={styles.content}>
        {tab === 'bom' ? <BomList /> : <WorkOrderList />}
      </div>
    </div>
  );
}
