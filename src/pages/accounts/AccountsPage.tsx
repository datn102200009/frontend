import React, { useMemo, useState } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@shared/ui/Button/Button';
import { DataTable } from '@shared/ui/DataTable/DataTable';
import { TableActions, ActionButton } from '@shared/ui/TableActions/TableActions';
import { ConfirmDialog } from '@shared/ui/ConfirmDialog/ConfirmDialog';
import { useToast } from '@shared/ui/Toast/Toast';
import { AccountModal } from './AccountModal';
import {
  useGetAccountsUsersQuery,
  useDeleteAccountsUsersMutation,
  type UserOutput,
} from '@features/accounts/api/accountsApi';
import styles from './AccountsPage.module.css';

export const AccountsPage: React.FC = () => {
  const { toast } = useToast();

  // Query users
  const { data: usersResponse, isLoading, refetch } = useGetAccountsUsersQuery({
    limit: 1000,
  });

  // Mutation delete
  const [deleteUser, { isLoading: isDeleting }] = useDeleteAccountsUsersMutation();

  // Selected User state for Create / Edit drawer
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserOutput | null>(null);

  // Selected User state for Delete confirmation dialog
  const [userToDelete, setUserToDelete] = useState<UserOutput | null>(null);

  const users = useMemo(() => {
    return usersResponse?.results || [];
  }, [usersResponse]);

  const handleCreateOpen = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEditOpen = (user: UserOutput) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    try {
      await deleteUser({ id: userToDelete.id }).unwrap();
      setUserToDelete(null);
      refetch();
      toast('success', 'Đã xóa tài khoản thành công!');
    } catch (err: any) {
      console.error(err);
      toast('error', err?.data?.detail || err?.data?.message || 'Không thể xóa tài khoản này.');
    }
  };

  const handleSuccess = (actionType: 'create' | 'update') => {
    setIsModalOpen(false);
    setSelectedUser(null);
    refetch();
    toast('success', actionType === 'create' ? 'Tạo mới tài khoản thành công!' : 'Cập nhật tài khoản và phân quyền thành công!');
  };

  const columns = useMemo(() => {
    const helper = createColumnHelper<UserOutput>();
    return [
      helper.accessor('username', {
        header: 'Tên đăng nhập',
        cell: (info) => <span className="font-semibold text-slate-800">{info.getValue()}</span>,
      }),
      helper.accessor('employee_name', {
        header: 'Nhân viên liên kết',
        cell: (info) => (
          <span className="font-medium text-slate-700">
            {info.getValue() || 'N/A'}{' '}
            <span style={{ fontSize: '11px', color: 'var(--clr-text-muted)' }}>
              ({info.row.original.employee_id})
            </span>
          </span>
        ),
      }),
      helper.accessor('last_login', {
        header: 'Đăng nhập cuối cùng',
        cell: (info) => {
          const val = info.getValue();
          if (!val) return <span style={{ color: 'var(--clr-text-muted)', fontSize: '12px' }}>Chưa đăng nhập</span>;
          return <span>{new Date(val).toLocaleString('vi-VN')}</span>;
        },
      }),
      helper.display({
        id: 'actions',
        header: 'Thao Tác',
        size: 100,
        cell: (info) => {
          const user = info.row.original;
          return (
            <TableActions>
              <ActionButton
                icon={<Edit size={15} />}
                title="Cập nhật tài khoản & phân quyền"
                onClick={() => handleEditOpen(user)}
              />
              <ActionButton
                icon={<Trash2 size={15} />}
                title="Xóa tài khoản"
                onClick={() => setUserToDelete(user)}
              />
            </TableActions>
          );
        },
      }),
    ];
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div>
              <h2 className={styles.title}>Quản Lý Tài Khoản & Phân Quyền</h2>
              <p className={styles.subtitle}>
                Quản lý tài khoản đăng nhập hệ thống của nhân viên và thiết lập phân quyền chi tiết (RBAC)
              </p>
            </div>
            <Button icon={<Plus size={16} />} onClick={handleCreateOpen}>
              Tạo Tài Khoản
            </Button>
          </div>

          <DataTable
            columns={columns}
            data={users}
            loading={isLoading}
            searchPlaceholder="Tìm kiếm tài khoản..."
            emptyMessage="Không có tài khoản nào"
            emptyDescription="Chưa có tài khoản người dùng nào được tạo."
          />
        </div>
      </div>

      {/* Slide-in Account Management Modal */}
      <AccountModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedUser(null);
        }}
        onSuccess={handleSuccess}
        userToEdit={selectedUser}
      />

      {/* Confirmation Dialog for deleting user */}
      {userToDelete && (
        <ConfirmDialog
          open={!!userToDelete}
          onClose={() => setUserToDelete(null)}
          onConfirm={handleDeleteConfirm}
          title="Xóa tài khoản người dùng"
          message={`Bạn có chắc chắn muốn xóa tài khoản "${userToDelete.username}" của nhân viên "${userToDelete.employee_name}"? Hành động này không thể hoàn tác.`}
          confirmText="Xóa tài khoản"
          cancelText="Hủy"
          variant="danger"
          loading={isDeleting}
        />
      )}
    </div>
  );
};

export default AccountsPage;
