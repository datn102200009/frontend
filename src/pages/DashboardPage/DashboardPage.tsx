import { Boxes, ClipboardList, AlertTriangle, TrendingUp, Package } from 'lucide-react';
import { useGetManufacturingBomListQuery, useGetManufacturingWorkOrderListQuery } from '@features/manufacturing/api/manufacturingApi';
import { useGetMasterDataItemsListQuery } from '@features/inventory/api/masterDataApi';
import { useGetInventoryStockLedgerBalanceQuery } from '@features/inventory/api/inventoryApi';
import styles from './DashboardPage.module.css';

const RECENT_ACTIVITIES = [
  { id: 1, action: 'Tạo BOM mới', target: 'Bàn học sinh BHS-001', user: 'Nguyễn Xuân Hòa', time: '2 giờ trước', type: 'bom' },
  { id: 2, action: 'Nhập kho', target: 'Thép ống D25 — 500 cái', user: 'Trần Thị Kho', time: '3 giờ trước', type: 'stock_in' },
  { id: 3, action: 'Hoàn thành lệnh SX', target: 'WO-2026-004', user: 'Nguyễn Xuân Hòa', time: '5 giờ trước', type: 'wo' },
  { id: 4, action: 'Xuất kho cho SX', target: 'Ốc vít M6 — 200 cái', user: 'Trần Thị Kho', time: '1 ngày trước', type: 'stock_out' },
  { id: 5, action: 'Tạo sản phẩm mới', target: 'Ghế xoay GX-101', user: 'Nguyễn Xuân Hòa', time: '1 ngày trước', type: 'product' },
];

export default function DashboardPage() {
  const { data: bomsData } = useGetManufacturingBomListQuery({});
  const { data: wosData } = useGetManufacturingWorkOrderListQuery({});
  const { data: itemsData } = useGetMasterDataItemsListQuery({ status: 'active', limit: 200 });
  const { data: stockBalances } = useGetInventoryStockLedgerBalanceQuery({ detailed: true });

  const bomCount = bomsData?.count || bomsData?.results?.length || 0;
  const woCount = wosData?.count || wosData?.results?.length || 0;
  const itemCount = itemsData?.count || itemsData?.results?.length || 0;

  const runningWosCount = (wosData?.results || []).filter(wo => wo.status === 'in_progress').length;
  const lowStockCount = (stockBalances || []).filter(b => (b.total_quantity || 0) < 50).length;

  const kpiCards = [
    { title: 'Định mức BOM', value: bomCount, icon: <Boxes size={22} />, color: 'primary' as const, change: 'Hoạt động' },
    { title: 'Lệnh sản xuất', value: woCount, icon: <ClipboardList size={22} />, color: 'secondary' as const, change: `${runningWosCount} đang chạy` },
    { title: 'Sản phẩm', value: itemCount, icon: <Package size={22} />, color: 'info' as const, change: 'Đang quản lý' },
    { title: 'Tồn kho thấp (<50)', value: lowStockCount, icon: <AlertTriangle size={22} />, color: 'warning' as const, change: lowStockCount > 0 ? 'Cần bổ sung' : 'An toàn' },
  ];

  return (
    <div className={styles.page}>
      {/* KPI Grid */}
      <div className={styles.kpiGrid}>
        {kpiCards.map((card, i) => (
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
