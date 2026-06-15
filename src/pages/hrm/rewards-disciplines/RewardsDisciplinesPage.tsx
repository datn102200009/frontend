import React from 'react';
import { RewardDisciplineTable } from '@widgets/hrm/RewardDisciplineTable';
import styles from '../HrmPage.module.css';

const RewardsDisciplinesPage: React.FC = () => {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div>
              <h2 className={styles.title}>Khen Thưởng & Kỷ Luật</h2>
              <p className={styles.subtitle}>Ghi nhận khen thưởng thành tích và xử lý kỷ luật lao động</p>
            </div>
          </div>
          <RewardDisciplineTable />
        </div>
      </div>
    </div>
  );
};

export default RewardsDisciplinesPage;
