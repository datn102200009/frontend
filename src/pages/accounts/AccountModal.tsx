import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShieldAlert, KeyRound } from 'lucide-react';
import { Button } from '@shared/ui/Button/Button';
import { Input } from '@shared/ui/Input/Input';
import { SearchableSelect } from '@shared/ui/Select/SearchableSelect';
import { Modal } from '@shared/ui/Modal/Modal';
import { useToast } from '@shared/ui/Toast/Toast';
import {
  useGetAccountsPermissionsQuery,
  useGetAccountsUsersUnlinkedEmployeesQuery,
  usePostAccountsUsersMutation,
  usePutAccountsUsersMutation,
  usePostAccountsUsersChangePasswordMutation,
  type UserOutput,
} from '@features/accounts/api/accountsApi';
import styles from './AccountModal.module.css';

// 2-level Group name mappings
const GROUP_NAMES: Record<string, string> = {
  hrm: 'Quản lý Nhân Sự (HRM)',
  inventory: 'Quản lý Kho (Inventory)',
  sales: 'Quản lý Bán Hàng (Sales)',
  purchasing: 'Quản lý Mua Hàng (Purchasing)',
  finance: 'Quản lý Tài chính (Finance)',
  crm: 'Quản lý Khách Hàng (CRM)',
  procurement: 'Quản lý Thu Mua (Procurement)',
  manufacturing: 'Quản lý Sản Xuất (Manufacturing)',
  accounts: 'Hệ Thống & Tài Khoản (Accounts)',
  master_data: 'Dữ liệu nền (Master Data)',
  common: 'Chức năng chung / Trợ lý AI',
};

const userCreateSchema = z.object({
  employee_id: z.string().min(1, 'Vui lòng chọn nhân sự'),
  username: z.string().min(3, 'Tên đăng nhập phải từ 3 ký tự trở lên').max(150),
  password: z.string()
    .min(8, 'Mật khẩu phải chứa ít nhất 8 ký tự')
    .refine((val) => /[A-Z]/.test(val), { message: 'Mật khẩu phải chứa ít nhất 1 chữ hoa' })
    .refine((val) => /[a-z]/.test(val), { message: 'Mật khẩu phải chứa ít nhất 1 chữ thường' })
    .refine((val) => /\d/.test(val), { message: 'Mật khẩu phải chứa ít nhất 1 chữ số' })
    .refine((val) => /[!@#$%^&*(),.?":{}|<>]/.test(val), { message: 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt' }),
});

const userUpdateSchema = z.object({});

const changePasswordSchema = z.object({
  password: z.string()
    .min(8, 'Mật khẩu phải chứa ít nhất 8 ký tự')
    .refine((val) => /[A-Z]/.test(val), { message: 'Mật khẩu phải chứa ít nhất 1 chữ hoa' })
    .refine((val) => /[a-z]/.test(val), { message: 'Mật khẩu phải chứa ít nhất 1 chữ thường' })
    .refine((val) => /\d/.test(val), { message: 'Mật khẩu phải chứa ít nhất 1 chữ số' })
    .refine((val) => /[!@#$%^&*(),.?":{}|<>]/.test(val), { message: 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt' }),
});

type UserCreateFields = z.infer<typeof userCreateSchema>;
type UserUpdateFields = z.infer<typeof userUpdateSchema>;
type ChangePasswordFields = z.infer<typeof changePasswordSchema>;

interface AccountModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (actionType: 'create' | 'update') => void;
  userToEdit: UserOutput | null;
}

// Checkbox custom component for intermediate state support
const Checkbox: React.FC<{
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  label: string;
  id: string;
  disabled?: boolean;
}> = ({ checked, indeterminate = false, onChange, label, id, disabled = false }) => {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <label htmlFor={id} className={styles.checkboxItem}>
      <input
        ref={ref}
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={styles.checkboxInput}
      />
      <span className={styles.checkboxLabel}>
        {label}
      </span>
    </label>
  );
};

export const AccountModal: React.FC<AccountModalProps> = ({
  open,
  onClose,
  onSuccess,
  userToEdit,
}) => {
  const { toast } = useToast();
  const isEdit = !!userToEdit;

  // Mutations
  const [createUser, { isLoading: isCreating }] = usePostAccountsUsersMutation();
  const [updateUser, { isLoading: isUpdating }] = usePutAccountsUsersMutation();
  const [changePassword, { isLoading: isChangingPassword }] = usePostAccountsUsersChangePasswordMutation();

  // Queries
  const { data: permissions = [], isLoading: isLoadingPermissions } = useGetAccountsPermissionsQuery();
  const { data: unlinkedEmployees = [], refetch: refetchUnlinked } = useGetAccountsUsersUnlinkedEmployeesQuery(undefined, {
    skip: isEdit,
  });

  // Local state for direct permissions list
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  // Change password sub-modal state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Form setups
  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    formState: { errors: errorsCreate },
    control: controlCreate,
    reset: resetCreate,
  } = useForm<UserCreateFields>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: {
      employee_id: '',
      username: '',
      password: '',
    },
  });

  const {
    handleSubmit: handleSubmitUpdate,
  } = useForm<UserUpdateFields>({
    resolver: zodResolver(userUpdateSchema),
    defaultValues: {},
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: errorsPassword },
    reset: resetPassword,
  } = useForm<ChangePasswordFields>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      password: '',
    },
  });

  // Sync edit values
  useEffect(() => {
    if (isEdit && userToEdit) {
      setSelectedPermissions(userToEdit.all_permissions || []);
      setApiError(null);
    } else {
      resetCreate();
      setSelectedPermissions([]);
      setApiError(null);
      if (open) {
        refetchUnlinked();
      }
    }
  }, [isEdit, userToEdit, resetCreate, open, refetchUnlinked]);

  // Group permissions by category (prefix before dot)
  const groupedPermissions = React.useMemo(() => {
    const groups: Record<string, { code: string; name: string }[]> = {};
    permissions.forEach((perm) => {
      const parts = perm.code.split('.');
      const prefix = parts.length > 1 ? parts[0] : 'other';
      if (!groups[prefix]) {
        groups[prefix] = [];
      }
      groups[prefix].push(perm);
    });
    return groups;
  }, [permissions]);

  // Handle group toggle (select all or deselect all)
  const handleGroupToggle = (groupCodes: string[]) => {
    const checkedInGroup = groupCodes.filter((code) => selectedPermissions.includes(code));
    const isGroupActive = checkedInGroup.length > 0;

    if (isGroupActive) {
      // Deselect all in group
      setSelectedPermissions((prev) => prev.filter((code) => !groupCodes.includes(code)));
    } else {
      // Select all in group
      setSelectedPermissions((prev) => {
        const otherPermissions = prev.filter((code) => !groupCodes.includes(code));
        return [...otherPermissions, ...groupCodes];
      });
    }
  };

  // Submit Actions
  const onSubmitCreate = async (values: UserCreateFields) => {
    setApiError(null);
    try {
      await createUser({
        body: {
          employee_id: values.employee_id,
          username: values.username,
          password: values.password,
          direct_permissions: selectedPermissions,
        },
      }).unwrap();
      onSuccess('create');
    } catch (err: any) {
      console.error(err);
      setApiError(err?.data?.detail || err?.data?.message || 'Có lỗi xảy ra khi tạo tài khoản.');
    }
  };

  const onSubmitUpdate = async () => {
    if (!userToEdit) return;
    setApiError(null);
    try {
      await updateUser({
        id: userToEdit.id,
        body: {
          direct_permissions: selectedPermissions,
        },
      }).unwrap();
      onSuccess('update');
    } catch (err: any) {
      console.error(err);
      setApiError(err?.data?.detail || err?.data?.message || 'Có lỗi xảy ra khi cập nhật tài khoản.');
    }
  };

  const onSubmitPassword = async (values: ChangePasswordFields) => {
    if (!userToEdit) return;
    setApiError(null);
    try {
      await changePassword({
        id: userToEdit.id,
        body: {
          password: values.password,
        },
      }).unwrap();
      setIsPasswordModalOpen(false);
      resetPassword();
      toast('success', 'Đổi mật khẩu tài khoản thành công!');
    } catch (err: any) {
      console.error(err);
      toast('error', err?.data?.detail || err?.data?.message || 'Không thể đổi mật khẩu.');
    }
  };

  const employeeOptions = [
    { label: '-- Chọn nhân sự --', value: '' },
    ...unlinkedEmployees.map((e) => ({
      label: `${e.employee_id} - ${e.full_name}`,
      value: e.employee_id,
    })),
  ];

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={isEdit ? 'Cập Nhật Tài Khoản' : 'Tạo Mới Tài Khoản'}
        size="lg"
        footer={
          <div style={{ display: 'flex', gap: 'var(--sp-3)', justifyContent: 'flex-end', width: '100%' }}>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isCreating || isUpdating}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              type="submit"
              form={isEdit ? 'update-user-form' : 'create-user-form'}
              loading={isCreating || isUpdating}
            >
              {isEdit ? 'Cập nhật' : 'Tạo tài khoản'}
            </Button>
          </div>
        }
      >
        <div className={styles.bodyContent}>
          {apiError && (
            <div className={styles.apiErrorBanner}>
              <ShieldAlert size={16} />
              <span>{apiError}</span>
            </div>
          )}

          {isEdit && userToEdit ? (
            <div className={styles.userInfoBox}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Tên đăng nhập</span>
                <span className={styles.infoValue}>{userToEdit.username}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Nhân sự liên kết</span>
                <span className={styles.infoValue}>
                  {userToEdit.employee_name} ({userToEdit.employee_id})
                </span>
              </div>
            </div>
          ) : null}

          {!isEdit ? (
            <form id="create-user-form" onSubmit={handleSubmitCreate(onSubmitCreate)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Controller
                name="employee_id"
                control={controlCreate}
                render={({ field }) => (
                  <SearchableSelect
                    options={employeeOptions.filter(o => o.value !== '')}
                    value={field.value}
                    onChange={field.onChange}
                    label="Nhân viên chưa có tài khoản"
                    placeholder="Chọn nhân viên..."
                    required
                    error={errorsCreate.employee_id?.message}
                    disabled={isCreating}
                  />
                )}
              />

              <Input
                label="Tên đăng nhập"
                placeholder="VD: nguyenvanan"
                required
                error={errorsCreate.username?.message}
                {...registerCreate('username')}
                disabled={isCreating}
              />

              <Input
                label="Mật khẩu"
                type="password"
                placeholder="Nhập mật khẩu mạnh"
                required
                error={errorsCreate.password?.message}
                {...registerCreate('password')}
                disabled={isCreating}
              />
            </form>
          ) : (
            <form id="update-user-form" onSubmit={handleSubmitUpdate(onSubmitUpdate)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Button
                type="button"
                variant="ghost"
                icon={<KeyRound size={16} />}
                className={styles.changePasswordBtn}
                onClick={() => setIsPasswordModalOpen(true)}
              >
                Thay đổi mật khẩu
              </Button>
            </form>
          )}

          <div>
            <h4 className={styles.sectionTitle}>Phân quyền theo Module</h4>
            <p className={styles.helperText}>
              Chọn các module chức năng để cấp toàn bộ quyền tương ứng cho người dùng này.
            </p>

            {isLoadingPermissions ? (
              <div>Đang tải danh sách quyền...</div>
            ) : (
              <div className={styles.permissionsContainer}>
                {Object.entries(groupedPermissions).map(([prefix, perms]) => {
                  const groupTitle = GROUP_NAMES[prefix] || prefix.toUpperCase();
                  const groupCodes = perms.map((p) => p.code);
                  const checkedInGroup = groupCodes.filter((code) => selectedPermissions.includes(code));
                  const isGroupActive = checkedInGroup.length > 0;

                  return (
                    <div key={prefix} className={styles.permissionGroup}>
                      <div className={styles.groupHeader}>
                        <Checkbox
                          id={`group-${prefix}`}
                          label={groupTitle}
                          checked={isGroupActive}
                          onChange={() => handleGroupToggle(groupCodes)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Sub-modal: Change Password */}
      {isPasswordModalOpen && (
        <Modal
          open={isPasswordModalOpen}
          onClose={() => {
            setIsPasswordModalOpen(false);
            resetPassword();
          }}
          title="Đổi mật khẩu người dùng"
          size="sm"
          nested
          footer={
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  resetPassword();
                }}
                disabled={isChangingPassword}
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmitPassword(onSubmitPassword)}
                loading={isChangingPassword}
              >
                Cập nhật mật khẩu
              </Button>
            </div>
          }
        >
          <form onSubmit={handleSubmitPassword(onSubmitPassword)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text-muted)', margin: 0 }}>
              Nhập mật khẩu mới cho tài khoản <strong>{userToEdit?.username}</strong>.
            </p>
            <Input
              label="Mật khẩu mới"
              type="password"
              placeholder="Nhập mật khẩu mới"
              required
              error={errorsPassword.password?.message}
              {...registerPassword('password')}
              disabled={isChangingPassword}
            />
          </form>
        </Modal>
      )}
    </>
  );
};
