import { useState, useEffect } from 'react';
import { Button, message, Select, Input, Drawer, Tag, Modal } from 'antd';
const { TextArea } = Input;
import { PlusOutlined, SearchOutlined, DeleteOutlined, InboxOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabase';
import dayjs from 'dayjs';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState([]);
  const [showArchived, setShowArchived] = useState(false);

  const [formData, setFormData] = useState({
    client_name: '',
    amount: '',
    status: 'not_paid',
    remarks: '',
  });

  useEffect(() => {
    fetchPayments();
  }, [showArchived]);

  useEffect(() => {
    filterPayments();
  }, [payments, searchText, statusFilter]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('is_archived', showArchived)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      message.error('Failed to fetch payments');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPayments = () => {
    let filtered = [...payments];

    if (searchText) {
      filtered = filtered.filter(payment =>
        payment.client_name?.toLowerCase().includes(searchText.toLowerCase()) ||
        payment.remarks?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (statusFilter.length > 0) {
      filtered = filtered.filter(payment => statusFilter.includes(payment.status));
    }

    setFilteredPayments(filtered);
  };

  const handleSubmit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (editingPayment) {
        const { error } = await supabase
          .from('payments')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingPayment.id);

        if (error) throw error;
        message.success('Payment updated successfully');
      } else {
        const { error } = await supabase
          .from('payments')
          .insert([{
            ...formData,
            created_by: user.id,
          }]);

        if (error) throw error;
        message.success('Payment added successfully');
      }

      setDrawerVisible(false);
      resetForm();
      fetchPayments();
    } catch (error) {
      message.error('Failed to save payment');
      console.error('Error:', error);
    }
  };

  const handleEdit = (payment) => {
    setEditingPayment(payment);
    setFormData({
      client_name: payment.client_name,
      amount: payment.amount,
      status: payment.status,
      remarks: payment.remarks || '',
    });
    setDrawerVisible(true);
  };

  const handleArchive = async (id) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ is_archived: true })
        .eq('id', id);

      if (error) throw error;
      message.success('Payment archived successfully');
      fetchPayments();
    } catch (error) {
      message.error('Failed to archive payment');
      console.error('Error:', error);
    }
  };

  const handleUnarchive = async (id) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ is_archived: false })
        .eq('id', id);

      if (error) throw error;
      message.success('Payment restored successfully');
      fetchPayments();
    } catch (error) {
      message.error('Failed to restore payment');
      console.error('Error:', error);
    }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Delete Payment',
      content: 'Are you sure you want to permanently delete this payment?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          const { error } = await supabase
            .from('payments')
            .delete()
            .eq('id', id);

          if (error) throw error;
          message.success('Payment deleted successfully');
          fetchPayments();
        } catch (error) {
          message.error('Failed to delete payment');
          console.error('Error:', error);
        }
      },
    });
  };

  const handleInlineEdit = async (paymentId, field, value) => {
    setPayments(prev =>
      prev.map(p => (p.id === paymentId ? { ...p, [field]: value } : p))
    );

    try {
      const { error } = await supabase
        .from('payments')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('id', paymentId);

      if (error) throw error;
    } catch (error) {
      message.error('Failed to update payment');
      console.error('Error:', error);
      fetchPayments();
    }
  };

  const resetForm = () => {
    setFormData({
      client_name: '',
      amount: '',
      status: 'not_paid',
      remarks: '',
    });
    setEditingPayment(null);
  };

  const getTotalAmount = () => {
    return filteredPayments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
  };

  const getPaidAmount = () => {
    return filteredPayments
      .filter(p => p.status === 'paid')
      .reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
  };

  const getUnpaidAmount = () => {
    return filteredPayments
      .filter(p => p.status === 'not_paid')
      .reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Payments Tracker</h1>
          <p className="text-gray-600 mt-1">Track all client payments and invoices</p>
        </div>
        <div className="flex gap-2">
          <Button
            type={showArchived ? 'default' : 'primary'}
            onClick={() => setShowArchived(!showArchived)}
            icon={<InboxOutlined />}
          >
            {showArchived ? 'Show Active' : 'Show Archived'}
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              resetForm();
              setDrawerVisible(true);
            }}
          >
            Add Payment
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">${getTotalAmount().toFixed(2)}</div>
            <div className="text-gray-600 mt-1">Total Amount</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">${getPaidAmount().toFixed(2)}</div>
            <div className="text-gray-600 mt-1">Paid</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">${getUnpaidAmount().toFixed(2)}</div>
            <div className="text-gray-600 mt-1">Unpaid</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex flex-wrap gap-4">
          <Input
            placeholder="Search by client name or remarks..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="flex-1 min-w-[200px]"
          />
          <Select
            mode="multiple"
            placeholder="Filter by status"
            value={statusFilter}
            onChange={setStatusFilter}
            className="w-48"
            options={[
              { label: 'Paid', value: 'paid' },
              { label: 'Not Paid', value: 'not_paid' },
            ]}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No payments found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remarks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Input
                        value={payment.client_name}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleInlineEdit(payment.id, 'client_name', e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        bordered={false}
                        className="font-medium text-gray-900 hover:bg-gray-100 px-2 -mx-2"
                        style={{ cursor: 'text' }}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <Input
                        type="number"
                        prefix="$"
                        value={payment.amount}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleInlineEdit(payment.id, 'amount', e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        bordered={false}
                        className="font-medium text-gray-900 hover:bg-gray-100 px-2 -mx-2"
                        style={{ cursor: 'text' }}
                      />
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={payment.status}
                        onChange={(value) => handleInlineEdit(payment.id, 'status', value)}
                        bordered={false}
                        style={{ width: '100%', marginLeft: -11 }}
                        className="hover:bg-gray-100"
                        suffixIcon={null}
                      >
                        <Select.Option value="paid">
                          <Tag color="green">Paid</Tag>
                        </Select.Option>
                        <Select.Option value="not_paid">
                          <Tag color="red">Not Paid</Tag>
                        </Select.Option>
                      </Select>
                    </td>
                    <td className="px-6 py-4">
                      <TextArea
                        value={payment.remarks || ''}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleInlineEdit(payment.id, 'remarks', e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Add remarks..."
                        bordered={false}
                        autoSize={{ minRows: 1, maxRows: 3 }}
                        className="text-sm text-gray-700 hover:bg-gray-100 px-2 -mx-2"
                        style={{ cursor: 'text' }}
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {dayjs(payment.created_at).format('MMM DD, YYYY')}
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        {showArchived ? (
                          <Button
                            type="link"
                            onClick={() => handleUnarchive(payment.id)}
                            className="text-blue-600"
                          >
                            Restore
                          </Button>
                        ) : (
                          <Button
                            type="link"
                            onClick={() => handleArchive(payment.id)}
                            className="text-gray-600"
                          >
                            Archive
                          </Button>
                        )}
                        <Button
                          type="link"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDelete(payment.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Drawer
        title={editingPayment ? 'Edit Payment' : 'Add New Payment'}
        open={drawerVisible}
        onClose={() => {
          setDrawerVisible(false);
          resetForm();
        }}
        width={500}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => {
              setDrawerVisible(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button type="primary" onClick={handleSubmit}>
              {editingPayment ? 'Update' : 'Add'} Payment
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client Name *
            </label>
            <Input
              value={formData.client_name}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              placeholder="Enter client name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount *
            </label>
            <Input
              type="number"
              prefix="$"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="Enter amount"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status *
            </label>
            <Select
              value={formData.status}
              onChange={(value) => setFormData({ ...formData, status: value })}
              className="w-full"
            >
              <Select.Option value="paid">Paid</Select.Option>
              <Select.Option value="not_paid">Not Paid</Select.Option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Remarks
            </label>
            <TextArea
              rows={4}
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Add any additional notes..."
            />
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default Payments;
