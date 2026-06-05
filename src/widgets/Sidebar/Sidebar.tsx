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
  Contact,
  Briefcase,
} from 'lucide-react';
import type { RootState } from '@app/store';
import { logout } from '@features/auth/model/authSlice';
import { Tooltip } from '@shared/ui/Tooltip/Tooltip';
import styles from './Sidebar.module.css';
import clsx from 'clsx';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const NAV_SECTIONS = [
  {
    label: 'Tổng Quan',
    items: [
      { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    ],
  },
  {
    label: 'Sản Xuất',
    items: [
      { to: '/bom', icon: <Boxes size={20} />, label: 'BOM' },
    ],
  },
  {
    label: 'Kho Bãi',
    items: [
      { to: '/inventory', icon: <Warehouse size={20} />, label: 'Kho' },
    ],
  },
  {
    label: 'Thương Mại',
    items: [
      { to: '/purchasing', icon: <ShoppingCart size={20} />, label: 'Mua Hàng' },
      { to: '/sales', icon: <ShoppingBag size={20} />, label: 'Bán Hàng' },
    ],
  },
  {
    label: 'Đối Tác',
    items: [
      { to: '/customers', icon: <Users size={20} />, label: 'Khách Hàng' },
      { to: '/suppliers', icon: <Truck size={20} />, label: 'Nhà Cung Cấp' },
    ],
  },
  {
    label: 'Tài Chính',
    items: [
      { to: '/finance', icon: <CircleDollarSign size={20} />, label: 'Dòng Tiền' },
      { to: '/finance/fixed-assets', icon: <Briefcase size={20} />, label: 'Tài Sản Cố Định' },
    ],
  },
  {
    label: 'Nhân Sự',
    items: [
      { to: '/hrm', icon: <Contact size={20} />, label: 'Quản Lý HR' },
    ],
  },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const user = useSelector((s: RootState) => s.auth.user);
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

  const roleLabel = user?.role?.toLowerCase() === 'admin' ? 'Quản trị viên' : user?.role?.toLowerCase() === 'manager' ? 'Quản lý' : 'Nhân viên';

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
          {NAV_SECTIONS.map((section) => (
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
