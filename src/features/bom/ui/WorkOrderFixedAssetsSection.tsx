import { useState } from 'react';
import { useGetFinanceFixedAssetsQuery } from '@entities/finance/api/financeApi';
import { SearchableSelect } from '@shared/ui/Select/SearchableSelect';
import { Button } from '@shared/ui/Button/Button';
import { Plus, X } from 'lucide-react';

interface Props {
  value: string[];
  onChange: (value: string[]) => void;
  isReadOnly?: boolean;
}

export function WorkOrderFixedAssetsSection({ value, onChange, isReadOnly = false }: Props) {
  const { data: fixedAssetsResp, isLoading } = useGetFinanceFixedAssetsQuery({
    statusIn: 'idle,active',
    depreciationMethod: 'unit_of_production',
    limit: 200,
  });
  const [selectedToSelect, setSelectedToSelect] = useState<string>('');

  const assets = fixedAssetsResp?.results || [];
  
  // Filter UOP assets
  const uopAssets = assets.filter(
    (a) => a.depreciation_method === 'unit_of_production'
  );

  // Map to get currently selected assets details
  const selectedAssets = value
    .map((id) => uopAssets.find((a) => a.id === id))
    .filter((a): a is NonNullable<typeof a> => !!a);

  // Available options: idle UOP assets not yet selected
  const availableOptions = uopAssets
    .filter((a) => a.status === 'idle' && !value.includes(a.id || ''))
    .map((a) => ({
      label: `${a.asset_code} - ${a.asset_name}`,
      value: a.id || '',
    }));

  const handleAdd = () => {
    if (selectedToSelect && !value.includes(selectedToSelect)) {
      onChange([...value, selectedToSelect]);
      setSelectedToSelect('');
    }
  };

  const handleRemove = (assetId: string) => {
    onChange(value.filter((id) => id !== assetId));
  };

  if (isLoading) {
    return <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text-muted)' }}>Đang tải danh sách tài sản...</div>;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--sp-3)',
        borderTop: '1px solid var(--clr-border)',
        paddingTop: 'var(--sp-4)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0, fontSize: 'var(--fs-base)', fontWeight: 600 }}>
          Tài sản cố định sử dụng (UOP)
        </h4>
        <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>
          (Chỉ áp dụng với tài sản khấu hao theo sản lượng - UOP)
        </span>
      </div>

      {!isReadOnly && (
        <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <SearchableSelect
              label=""
              placeholder="-- Chọn tài sản cố định (UOP) --"
              options={availableOptions}
              value={selectedToSelect}
              onChange={(val) => setSelectedToSelect(val)}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleAdd}
            disabled={!selectedToSelect}
            icon={<Plus size={16} />}
          >
            Thêm
          </Button>
        </div>
      )}

      {selectedAssets.length === 0 ? (
        <div
          style={{
            fontSize: 'var(--fs-sm)',
            color: 'var(--clr-text-muted)',
            padding: 'var(--sp-3)',
            background: 'var(--clr-surface-alt)',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
          }}
        >
          Chưa có tài sản cố định nào được chọn cho lệnh sản xuất này.
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--sp-2)',
            maxHeight: '180px',
            overflowY: 'auto',
            paddingRight: '4px',
          }}
        >
          {selectedAssets.map((asset) => (
            <div
              key={asset.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--sp-2) var(--sp-3)',
                background: 'var(--clr-surface-alt)',
                border: '1px solid var(--clr-border)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 500, fontSize: 'var(--fs-sm)' }}>{asset.asset_name}</span>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>
                  Mã: {asset.asset_code}
                </span>
              </div>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => handleRemove(asset.id!)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: 'var(--clr-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                    borderRadius: '4px',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = 'var(--clr-error)')}
                  onMouseOut={(e) => (e.currentTarget.style.color = 'var(--clr-text-muted)')}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
