import { Menu } from 'lucide-react';
import styles from './Header.module.css';

interface HeaderProps {
  onMenuToggle: () => void;
  title: string;
}

export function Header({ onMenuToggle, title }: HeaderProps) {
  return (
    <header className={styles.header}>
      <button
        type="button"
        className={styles.menuBtn}
        onClick={onMenuToggle}
        aria-label="Mở menu"
      >
        <Menu size={22} />
      </button>
      <h1 className={styles.title}>{title}</h1>
    </header>
  );
}
