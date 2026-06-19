import { WorkOrderList } from '@features/bom/ui/WorkOrderList';
import styles from './WorkOrdersPage.module.css';

export default function WorkOrdersPage() {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <WorkOrderList />
      </div>
    </div>
  );
}
