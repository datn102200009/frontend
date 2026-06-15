import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { BomList } from '@features/bom/ui/BomList';
import styles from './BomPage.module.css';

export default function BomPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tab = searchParams.get('tab');

  useEffect(() => {
    if (tab === 'wo') {
      const params = new URLSearchParams(searchParams);
      params.delete('tab');
      navigate(`/work-orders?${params.toString()}`, { replace: true });
    }
  }, [tab, navigate, searchParams]);

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <BomList />
      </div>
    </div>
  );
}
