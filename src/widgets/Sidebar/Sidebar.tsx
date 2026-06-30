import { NavLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  LayoutDashboard,
  Boxes,
  Warehouse,
  ClipboardList,
  ShoppingCart,
  ShoppingBag,
  CircleDollarSign,
  LogOut,
  X,
  Users,
  Truck,
  Briefcase,
  FileText,
  CalendarCheck,
  Award,
  CalendarDays,
  Wallet,
} from 'lucide-react';
import type { RootState } from '@app/store';
import { logout } from '@features/auth/model/authSlice';
import { Tooltip } from '@shared/ui/Tooltip/Tooltip';
import { useCurrentUser } from '@shared/lib/permissionContext';
import styles from './Sidebar.module.css';
import clsx from 'clsx';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  permission?: string | string[];
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Tổng Quan',
    items: [
      { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
      { to: '/system-log', icon: <FileText size={20} />, label: 'Nhật Kí Hoạt Động' },
    ],
  },
  {
    label: 'Sản Xuất',
    items: [
      { to: '/bom', icon: <Boxes size={20} />, label: 'BOM', permission: 'manufacturing.bom_view' },
      { to: '/work-orders', icon: <ClipboardList size={20} />, label: 'Lệnh Sản Xuất', permission: 'manufacturing.work_order_view' },
    ],
  },
  {
    label: 'Kho Bãi',
    items: [
      { to: '/inventory', icon: <Warehouse size={20} />, label: 'Kho', permission: 'inventory.view' },
    ],
  },
  {
    label: 'Thương Mại',
    items: [
      { to: '/purchasing', icon: <ShoppingCart size={20} />, label: 'Mua Hàng', permission: 'purchasing.view_order' },
      { to: '/sales', icon: <ShoppingBag size={20} />, label: 'Bán Hàng', permission: 'sales.view_order' },
    ],
  },
  {
    label: 'Đối Tác',
    items: [
      { to: '/customers', icon: <Users size={20} />, label: 'Khách Hàng', permission: 'crm.customer_view' },
      { to: '/suppliers', icon: <Truck size={20} />, label: 'Nhà Cung Cấp', permission: 'procurement.supplier_view' },
    ],
  },
  {
    label: 'Tài Chính',
    items: [
      { to: '/finance', icon: <CircleDollarSign size={20} />, label: 'Dòng Tiền', permission: 'finance.view_cash_flow' },
      { to: '/invoices', icon: <FileText size={20} />, label: 'Hoá Đơn Mua/Bán', permission: ['finance.pay_invoice', 'finance.collect_sales_invoice'] },
      { to: '/fixed-assets', icon: <Briefcase size={20} />, label: 'Tài Sản Cố Định', permission: 'finance.view_fixed_asset' },
    ],
  },
  {
    label: 'Nhân Sự',
    items: [
      { to: '/hrm/employees', icon: <Users size={20} />, label: 'Nhân Viên', permission: 'hrm.view_employee' },
      { to: '/hrm/attendance-leave', icon: <CalendarCheck size={20} />, label: 'Chấm Công & Nghỉ Phép', permission: ['hrm.view_attendance', 'hrm.view_leaverequest'] },
      { to: '/hrm/rewards-disciplines', icon: <Award size={20} />, label: 'Khen Thưởng & Kỷ Luật', permission: ['hrm.view_rewardrecord', 'hrm.view_disciplinerecord'] },
      { to: '/hrm/holidays', icon: <CalendarDays size={20} />, label: 'Ngày Nghỉ Lễ', permission: 'hrm.view_publicholiday' },
      { to: '/hrm/payroll', icon: <Wallet size={20} />, label: 'Bảng Lương', permission: 'finance.view_salaryslip' },
    ],
  },
  {
    label: 'Hệ Thống',
    items: [
      { to: '/accounts', icon: <Users size={20} />, label: 'Quản lý Tài Khoản', permission: 'accounts.view_user' },
    ],
  },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const user = useSelector((s: RootState) => s.auth.user);
  const currentUser = useCurrentUser();
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((w) => w[0])
        .slice(-2)
        .join('')
        .toUpperCase()
    : '??';

  const roleLabel = (currentUser?.permissions?.includes('accounts.view_user') || user?.username === 'admin') ? 'Quản trị viên' : 'Nhân viên';

  // Filter navigation sections based on user permissions
  const filteredSections = NAV_SECTIONS.map((section) => {
    const allowedItems = section.items.filter((item) => {
      if (user?.username === 'admin') return true;
      if (!item.permission) return true;
      if (Array.isArray(item.permission)) {
        return item.permission.some((p) => currentUser?.permissions?.includes(p));
      }
      return currentUser?.permissions?.includes(item.permission);
    });
    return { ...section, items: allowedItems };
  }).filter((section) => section.items.length > 0);

  return (
    <>
      {/* Mobile backdrop */}
      {open && <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />}

      <aside className={clsx(styles.sidebar, open && styles.open)} aria-label="Điều hướng chính">
        {/* Logo */}
        <div className={styles.logo}>
          <ClipboardList size={28} strokeWidth={1.8} />
          <div className={styles.logoText}>
            <span className={styles.brand}>Xuân Hòa</span>
            <span className={styles.subBrand}>ERP System</span>
          </div>
          <button type="button" className={styles.closeMobile} onClick={onClose} aria-label="Đóng menu">
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {filteredSections.map((section) => (
            <div key={section.label} className={styles.section}>
              <span className={styles.sectionLabel}>{section.label}</span>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    clsx(styles.navItem, isActive && styles.active)
                  }
                  onClick={onClose}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className={styles.userArea}>
          <div className={styles.avatar}>{initials}</div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.full_name}</span>
            <span className={styles.userRole}>{roleLabel}</span>
          </div>
          <Tooltip content="Đăng xuất">
            <button type="button" className={styles.logoutBtn} onClick={handleLogout} aria-label="Đăng xuất">
              <LogOut size={18} />
            </button>
          </Tooltip>
        </div>
      </aside>
    </>
  );
}
