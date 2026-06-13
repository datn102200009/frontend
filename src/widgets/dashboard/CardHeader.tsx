import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import baseStyles from './DashboardWidgets.module.css';
import styles from './CardHeader.module.css';

export interface CardHeaderProps {
  title: string;
  icon?: ReactNode;
  /**
   * Optional list of URLs the user can navigate to from the card.
   * When provided with at least one entry, the title and the icon become
   * navigation links pointing to `quickLinks[0]`.
   */
  quickLinks?: string[];
  /** Optional badge/children rendered between the title and the icon. */
  meta?: ReactNode;
}

/**
 * Shared card header used by all dashboard widget cards.
 *
 * - When `quickLinks[0]` is set, the title becomes a `<Link>` and the icon
 *   container becomes a separate `<Link>` (better discoverability).
 * - Hovering the title changes color to primary and adds a subtle underline.
 * - Hovering the icon-link lifts it slightly and intensifies the background.
 *
 * If `quickLinks` is empty/missing, both the title and the icon are rendered
 * as plain elements so the card still works as a static display.
 */
export function CardHeader({ title, icon, quickLinks = [], meta }: CardHeaderProps) {
  const href = quickLinks.length > 0 ? quickLinks[0] : null;
  const ariaLabel = `Mở chi tiết: ${title}`;

  return (
    <div className={baseStyles.cardHeader}>
      <div className={baseStyles.titleArea}>
        {href ? (
          <Link to={href} className={`${baseStyles.cardTitle} ${styles.titleLink}`} aria-label={ariaLabel}>
            <span className={styles.titleText}>{title}</span>
            <ArrowUpRight size={14} strokeWidth={2.5} className={styles.titleIcon} aria-hidden="true" />
          </Link>
        ) : (
          <span className={baseStyles.cardTitle}>{title}</span>
        )}
        {meta}
      </div>
      <div className={baseStyles.cardActions}>
        {icon ? (
          href ? (
            <Link to={href} className={styles.iconLink} aria-label={ariaLabel}>
              {icon}
            </Link>
          ) : (
            <span className={baseStyles.cardIcon}>{icon}</span>
          )
        ) : null}
      </div>
    </div>
  );
}
