import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@shared/ui/Button/Button';

// Tables
import { PublicHolidayTable } from '@widgets/hrm/PublicHolidayTable';

// Modals
import { PublicHolidayFormModal } from '@features/hrm/manage-public-holiday/ui/PublicHolidayFormModal';

// Types
import type { PublicHoliday } from '@entities/hrm/model/types';
import styles from '../HrmPage.module.css';

const HolidaysPage: React.FC = () => {
  const [isHolidayCreateOpen, setIsHolidayCreateOpen] = useState(false);
  const [selectedHolidayForEdit, setSelectedHolidayForEdit] = useState<PublicHoliday | null>(null);

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div>
              <h2 className={styles.title}>Quản Lý Ngày Nghỉ Lễ</h2>
              <p className={styles.subtitle}>Cấu hình danh sách ngày nghỉ Lễ/Tết trong năm</p>
            </div>
            <Button icon={<Plus size={16} />} onClick={() => setIsHolidayCreateOpen(true)}>
              Thêm Ngày Nghỉ Lễ
            </Button>
          </div>
          <PublicHolidayTable onEdit={(holiday) => setSelectedHolidayForEdit(holiday)} />
        </div>
      </div>

      {/* Public Holiday Modals */}
      {(isHolidayCreateOpen || !!selectedHolidayForEdit) && (
        <PublicHolidayFormModal
          open={isHolidayCreateOpen || !!selectedHolidayForEdit}
          onClose={() => {
            setIsHolidayCreateOpen(false);
            setSelectedHolidayForEdit(null);
          }}
          onSuccess={() => {
            setIsHolidayCreateOpen(false);
            setSelectedHolidayForEdit(null);
          }}
          holiday={selectedHolidayForEdit || undefined}
        />
      )}
    </div>
  );
};

export default HolidaysPage;
