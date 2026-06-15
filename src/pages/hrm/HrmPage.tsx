import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function HrmPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tab = searchParams.get('tab');

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (!tab) {
      navigate('/hrm/employees', { replace: true });
      return;
    }

    params.delete('tab');
    const queryString = params.toString() ? `&${params.toString()}` : '';

    if (tab === 'employees' || tab === 'proposals') {
      navigate(`/hrm/employees?tab=${tab}${queryString}`, { replace: true });
    } else if (tab === 'attendance' || tab === 'leave') {
      navigate(`/hrm/attendance-leave?tab=${tab}${queryString}`, { replace: true });
    } else if (tab === 'rewards_disciplines') {
      navigate(`/hrm/rewards-disciplines?${params.toString()}`, { replace: true });
    } else if (tab === 'public_holidays') {
      navigate(`/hrm/holidays?${params.toString()}`, { replace: true });
    } else if (tab === 'salary') {
      navigate(`/hrm/payroll?${params.toString()}`, { replace: true });
    } else {
      navigate('/hrm/employees', { replace: true });
    }
  }, [tab, navigate, searchParams]);

  return null;
}
