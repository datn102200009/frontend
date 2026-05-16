import { Boxes, ClipboardList, AlertTriangle, TrendingUp, Package } from 'lucide-react';
import styles from './DashboardPage.module.css';

const KPI_CARDS = [
  { title: 'Định mức BOM', value: 12, icon: <Boxes size={22} />, color: 'primary' as const, change: '+2 tuần này' },
  { title: 'Lệnh sản xuất', value: 5, icon: <ClipboardList size={22} />, color: 'secondary' as const, change: '3 đang chạy' },
  { title: 'Sản phẩm', value: 48, icon: <Package size={22} />, color: 'info' as const, change: '+5 tháng này' },
  { title: 'Tồn kho thấp', value: 3, icon: <AlertTriangle size={22} />, color: 'warning' as const, change: 'Cần bổ sung' },
];

const RECENT_ACTIVITIES = [
  { id: 1, action: 'Tạo BOM mới', target: 'Bàn học sinh BHS-001', user: 'Nguyễn Xuân Hòa', time: '2 giờ trước', type: 'bom' },
  { id: 2, action: 'Nhập kho', target: 'Thép ống D25 — 500 cái', user: 'Trần Thị Kho', time: '3 giờ trước', type: 'stock_in' },
  { id: 3, action: 'Hoàn thành lệnh SX', target: 'WO-2026-004', user: 'Nguyễn Xuân Hòa', time: '5 giờ trước', type: 'wo' },
  { id: 4, action: 'Xuất kho cho SX', target: 'Ốc vít M6 — 200 cái', user: 'Trần Thị Kho', time: '1 ngày trước', type: 'stock_out' },
  { id: 5, action: 'Tạo sản phẩm mới', target: 'Ghế xoay GX-101', user: 'Nguyễn Xuân Hòa', time: '1 ngày trước', type: 'product' },
];

export default function DashboardPage() {
  return (
    <div className={styles.page}>
      {/* KPI Grid */}
      <div className={styles.kpiGrid}>
        {KPI_CARDS.map((card, i) => (
          <div key={card.title} className={styles.kpiCard} style={{ animationDelay: `${i * 60}ms` }}>
            <div className={`${styles.kpiIcon} ${styles[card.color]}`}>
              {card.icon}
            </div>
            <div className={styles.kpiBody}>
              <span className={styles.kpiTitle}>{card.title}</span>
              <span className={styles.kpiValue}>{card.value}</span>
              <span className={styles.kpiChange}>
                <TrendingUp size={12} />
                {card.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Hoạt Động Gần Đây</h2>
        <div className={styles.activityCard}>
          {RECENT_ACTIVITIES.map((act) => (
            <div key={act.id} className={styles.activityRow}>
              <div className={styles.activityDot} />
              <div className={styles.activityContent}>
                <span className={styles.activityAction}>{act.action}</span>
                <span className={styles.activityTarget}>{act.target}</span>
              </div>
              <div className={styles.activityMeta}>
                <span className={styles.activityUser}>{act.user}</span>
                <span className={styles.activityTime}>{act.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
