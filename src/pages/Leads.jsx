import { useState, useEffect, useCallback } from 'react';
import { Button, message, Select, Input, Tag, Avatar, Drawer, Skeleton, Modal, Popover } from 'antd';
import { PlusOutlined, SearchOutlined, UserOutlined, GlobalOutlined, CloseOutlined, MailOutlined, PhoneOutlined, DeleteOutlined, InboxOutlined, EyeOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';
import debounce from 'lodash.debounce';

const { TextArea } = Input;

const AVAILABLE_ICONS = [
  '👤', '👨', '👩', '👔', '💼', '🏢', '🏭', '🏪', '🏬', '🛍️',
  '💻', '📱', '🖥️', '⌨️', '🖱️', '🎯', '📊', '📈', '💰', '💵',
  '🌐', '🌍', '🌎', '🌏', '🗺️', '📍', '🚀', '✈️', '🎨', '🎭',
  '⭐', '🌟', '💫', '✨', '🔥', '💡', '🎪', '🎬', '📺', '📻',
  '📞', '☎️', '📧', '✉️', '📮', '🔔', '🎁', '🎉', '🎊', '🎈',
];

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    fetchLeads();
  }, [showArchived]);

  useEffect(() => {
    filterLeads();
  }, [leads, searchText, statusFilter]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('is_archived', showArchived)
        .order('closing_percentage', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      message.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  const filterLeads = () => {
    let filtered = [...leads];

    if (searchText) {
      filtered = filtered.filter(l =>
        l.name.toLowerCase().includes(searchText.toLowerCase()) ||
        l.remarks?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(l => l.status === statusFilter);
    }

    setFilteredLeads(filtered);
  };

  const debouncedUpdate = useCallback(
    debounce(async (leadId, field, value) => {
      try {
        const { error } = await supabase
          .from('leads')
          .update({ [field]: value })
          .eq('id', leadId);

        if (error) throw error;
      } catch (error) {
        message.error('Failed to update lead');
        console.error('Error:', error);
      }
    }, 800),
    []
  );

  const handleInlineEdit = (leadId, field, value) => {
    setLeads(prev => {
      const updated = prev.map(l => (l.id === leadId ? { ...l, [field]: value } : l));

      if (field === 'closing_percentage') {
        return updated.sort((a, b) => {
          const percentDiff = (b.closing_percentage || 0) - (a.closing_percentage || 0);
          if (percentDiff !== 0) return percentDiff;
          return new Date(b.created_at) - new Date(a.created_at);
        });
      }

      return updated;
    });
    debouncedUpdate(leadId, field, value);
  };

  const handleAddLead = () => {
    setEditingLead(null);
    setDrawerVisible(true);
  };

  const handleRowClick = (lead) => {
    setEditingLead(lead);
    setDrawerVisible(true);
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
    setEditingLead(null);
    fetchLeads();
  };

  const handleArchiveLead = async (leadId) => {
    Modal.confirm({
      title: 'Archive Lead',
      content: 'Are you sure you want to archive this lead? It will be hidden from the main view but can be restored later.',
      okText: 'Archive',
      onOk: async () => {
        try {
          const { error } = await supabase
            .from('leads')
            .update({ is_archived: true })
            .eq('id', leadId);

          if (error) throw error;

          message.success('Lead archived successfully');
          setDrawerVisible(false);
          fetchLeads();
        } catch (error) {
          message.error('Failed to archive lead');
          console.error('Error:', error);
        }
      },
    });
  };

  const handleUnarchiveLead = async (leadId) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ is_archived: false })
        .eq('id', leadId);

      if (error) throw error;

      message.success('Lead restored successfully');
      setDrawerVisible(false);
      fetchLeads();
    } catch (error) {
      message.error('Failed to restore lead');
      console.error('Error:', error);
    }
  };

  const handleDeleteLead = async (leadId) => {
    Modal.confirm({
      title: 'Delete Lead',
      content: 'Are you sure you want to permanently delete this lead? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          const { error } = await supabase
            .from('leads')
            .delete()
            .eq('id', leadId);

          if (error) throw error;

          message.success('Lead deleted successfully');
          setDrawerVisible(false);
          fetchLeads();
        } catch (error) {
          message.error('Failed to delete lead');
          console.error('Error:', error);
        }
      },
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'in_progress': 'blue',
      'closed': 'green',
      'not_closed': 'default',
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'in_progress': 'In Progress',
      'closed': 'Closed',
      'not_closed': 'Not Closed',
    };
    return labels[status] || status;
  };

  const getSourceIcon = (source) => {
    const icons = {
      'website': '🌐',
      'referral': '👥',
      'social_media': '📱',
      'cold_call': '📞',
      'email': '📧',
      'fiverr': '💼',
      'upwork': '💻',
      'whatsapp': '💬',
      'other': '📋',
    };
    return icons[source] || '📋';
  };

  return (
    <div className="h-full bg-white">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <GlobalOutlined className="text-2xl" />
            <h1 className="text-2xl font-semibold m-0">Leads</h1>
          </div>
          <div className="flex gap-2">
            <Button
              icon={<InboxOutlined />}
              onClick={() => setShowArchived(!showArchived)}
              size="large"
              style={{
                borderRadius: '6px',
                height: '38px',
                fontWeight: 500,
              }}
            >
              {showArchived ? 'Show Active' : 'Show Archived'}
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddLead}
              size="large"
              style={{
                backgroundColor: '#2563eb',
                borderRadius: '6px',
                height: '38px',
                fontWeight: 500,
              }}
            >
              New
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Input
            placeholder="Search leads..."
            prefix={<SearchOutlined className="text-gray-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{
              width: 300,
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
            }}
            size="large"
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 180, borderRadius: '6px' }}
            size="large"
            options={[
              { label: 'All Status', value: 'all' },
              { label: 'In Progress', value: 'in_progress' },
              { label: 'Closed', value: 'closed' },
              { label: 'Not Closed', value: 'not_closed' },
            ]}
          />
          <span className="text-gray-500 ml-2">{filteredLeads.length} leads</span>
        </div>
      </div>

      <div className="overflow-auto" style={{ height: 'calc(100vh - 250px)' }}>
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton.Avatar active size={40} />
                <Skeleton active paragraph={{ rows: 1 }} className="flex-1" />
              </div>
            ))}
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <GlobalOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <p>No leads found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="sticky top-0 bg-gray-50 z-10">
              <tr className="border-b border-gray-200">
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{ width: '50px' }}>

                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{ width: '25%' }}>
                  Name
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{ width: '28%' }}>
                  Remarks
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{ width: '15%' }}>
                  Last Followup
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{ width: '12%' }}>
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{ width: '12%' }}>
                  Source
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{ width: '10%' }}>
                  Closing %
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{ width: '8%' }}>
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors group"
                >
                  <td className="px-4 py-4 text-center">
                    <Button
                      type="text"
                      icon={<EyeOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(lead);
                      }}
                      className="text-gray-400 hover:text-blue-600"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Popover
                        content={
                          <div style={{ width: 280 }}>
                            <div className="grid grid-cols-8 gap-2">
                              {AVAILABLE_ICONS.map((icon) => (
                                <button
                                  key={icon}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleInlineEdit(lead.id, 'icon', icon);
                                  }}
                                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded cursor-pointer text-xl"
                                  style={{ border: 'none', background: 'none' }}
                                >
                                  {icon}
                                </button>
                              ))}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleInlineEdit(lead.id, 'icon', '');
                                }}
                                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded cursor-pointer text-xs"
                                style={{ border: 'none', background: 'none' }}
                                title="Remove icon"
                              >
                                <CloseOutlined />
                              </button>
                            </div>
                          </div>
                        }
                        title="Select Icon"
                        trigger="click"
                      >
                        <Avatar
                          style={{
                            backgroundColor: lead.icon ? '#f3f4f6' : '#2563eb',
                            cursor: 'pointer'
                          }}
                          icon={lead.icon ? null : <UserOutlined />}
                          size={32}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {lead.icon && <span style={{ fontSize: '18px' }}>{lead.icon}</span>}
                        </Avatar>
                      </Popover>
                      <Input
                        value={lead.name}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleInlineEdit(lead.id, 'name', e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        variant="borderless"
                        className="font-medium text-gray-900 hover:bg-gray-100 px-2 -mx-2"
                        style={{ cursor: 'text' }}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <TextArea
                      value={lead.remarks || ''}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleInlineEdit(lead.id, 'remarks', e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Add remarks..."
                      variant="borderless"
                      autoSize={{ minRows: 1, maxRows: 3 }}
                      className="text-sm text-gray-700 hover:bg-gray-100 px-2 -mx-2"
                      style={{ cursor: 'text' }}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <Input
                      type="date"
                      value={lead.last_followup_date || ''}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleInlineEdit(lead.id, 'last_followup_date', e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      variant="borderless"
                      className="text-sm text-gray-700 hover:bg-gray-100 px-2 -mx-2"
                      style={{ cursor: 'text' }}
                    />
                  </td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={lead.status}
                      onChange={(value) => handleInlineEdit(lead.id, 'status', value)}
                      variant="borderless"
                      style={{ width: '100%', marginLeft: -11 }}
                      className="hover:bg-gray-100"
                      suffixIcon={null}
                    >
                      <Select.Option value="in_progress">
                        <Tag color="blue">In Progress</Tag>
                      </Select.Option>
                      <Select.Option value="closed">
                        <Tag color="green">Closed</Tag>
                      </Select.Option>
                      <Select.Option value="not_closed">
                        <Tag color="default">Not Closed</Tag>
                      </Select.Option>
                    </Select>
                  </td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={lead.source}
                      onChange={(value) => handleInlineEdit(lead.id, 'source', value)}
                      variant="borderless"
                      style={{ width: '100%', marginLeft: -11 }}
                      className="hover:bg-gray-100"
                      suffixIcon={null}
                    >
                      <Select.Option value="website">
                        <span className="flex items-center gap-2">
                          <span>🌐</span> Website
                        </span>
                      </Select.Option>
                      <Select.Option value="referral">
                        <span className="flex items-center gap-2">
                          <span>👥</span> Referral
                        </span>
                      </Select.Option>
                      <Select.Option value="social_media">
                        <span className="flex items-center gap-2">
                          <span>📱</span> Social Media
                        </span>
                      </Select.Option>
                      <Select.Option value="cold_call">
                        <span className="flex items-center gap-2">
                          <span>📞</span> Cold Call
                        </span>
                      </Select.Option>
                      <Select.Option value="email">
                        <span className="flex items-center gap-2">
                          <span>📧</span> Email
                        </span>
                      </Select.Option>
                      <Select.Option value="fiverr">
                        <span className="flex items-center gap-2">
                          <span>💼</span> Fiverr
                        </span>
                      </Select.Option>
                      <Select.Option value="upwork">
                        <span className="flex items-center gap-2">
                          <span>💻</span> Upwork
                        </span>
                      </Select.Option>
                      <Select.Option value="whatsapp">
                        <span className="flex items-center gap-2">
                          <span>💬</span> WhatsApp
                        </span>
                      </Select.Option>
                      <Select.Option value="other">
                        <span className="flex items-center gap-2">
                          <span>📋</span> Other
                        </span>
                      </Select.Option>
                    </Select>
                  </td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <Input
                      type="number"
                      value={lead.closing_percentage || 0}
                      onChange={(e) => {
                        const value = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                        handleInlineEdit(lead.id, 'closing_percentage', value);
                      }}
                      suffix="%"
                      variant="borderless"
                      className="text-sm text-gray-700 hover:bg-gray-100 px-2 -mx-2 w-20"
                      style={{ cursor: 'text' }}
                      min={0}
                      max={100}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700">
                      {dayjs(lead.created_at).format('MM/DD/YY')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Drawer
        title={
          <div className="flex items-center justify-between">
            <span className="text-xl font-semibold">
              {editingLead ? 'Lead Details' : 'New Lead'}
            </span>
            {editingLead && (
              <div className="flex gap-2">
                {showArchived ? (
                  <Button
                    icon={<InboxOutlined />}
                    onClick={() => handleUnarchiveLead(editingLead.id)}
                    size="small"
                    type="primary"
                  >
                    Restore
                  </Button>
                ) : (
                  <Button
                    icon={<InboxOutlined />}
                    onClick={() => handleArchiveLead(editingLead.id)}
                    size="small"
                  >
                    Archive
                  </Button>
                )}
                <Button
                  icon={<DeleteOutlined />}
                  danger
                  onClick={() => handleDeleteLead(editingLead.id)}
                  size="small"
                >
                  Delete
                </Button>
              </div>
            )}
          </div>
        }
        placement="right"
        onClose={handleDrawerClose}
        open={drawerVisible}
        size={600}
        closeIcon={<CloseOutlined />}
      >
        <LeadForm
          lead={editingLead}
          profile={profile}
          onClose={handleDrawerClose}
        />
      </Drawer>
    </div>
  );
};

const LeadForm = ({ lead, profile, onClose }) => {
const [formData, setFormData] = useState({
    name: lead?.name || '',
    status: lead?.status || 'in_progress',
    source: lead?.source || 'website',
    remarks: lead?.remarks || '',
    last_followup_date: lead?.last_followup_date || '',
    icon: lead?.icon || '',
    closing_percentage: lead?.closing_percentage || 0,
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.name) {
      message.error('Lead name is required');
      return;
    }

    setSaving(true);
    try {
      if (lead) {
        const { error } = await supabase
          .from('leads')
          .update(formData)
          .eq('id', lead.id);

        if (error) throw error;
        message.success('Lead updated successfully');
      } else {
        const { error } = await supabase
          .from('leads')
          .insert([{
            ...formData,
            created_by: profile.id,
          }]);

        if (error) throw error;
        message.success('Lead created successfully');
      }
      onClose();
    } catch (error) {
      message.error('Failed to save lead');
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!lead) return;

    try {
      const { error } = await supabase
        .from('leads')
        .update({ archived: true })
        .eq('id', lead.id);

      if (error) throw error;
      message.success('Lead archived successfully');
      onClose();
    } catch (error) {
      message.error('Failed to archive lead');
      console.error('Error:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
        <Input
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Enter lead name"
          size="large"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
        <Popover
          content={
            <div style={{ width: 280 }}>
              <div className="grid grid-cols-8 gap-2">
                {AVAILABLE_ICONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => handleChange('icon', icon)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded cursor-pointer text-xl"
                    style={{ border: 'none', background: formData.icon === icon ? '#e5e7eb' : 'none' }}
                  >
                    {icon}
                  </button>
                ))}
                <button
                  onClick={() => handleChange('icon', '')}
                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded cursor-pointer text-xs"
                  style={{ border: 'none', background: 'none' }}
                  title="Remove icon"
                >
                  <CloseOutlined />
                </button>
              </div>
            </div>
          }
          title="Select Icon"
          trigger="click"
        >
          <Button size="large" style={{ width: 100 }}>
            {formData.icon ? <span style={{ fontSize: '24px' }}>{formData.icon}</span> : 'Select Icon'}
          </Button>
        </Popover>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <Select
            value={formData.status}
            onChange={(value) => handleChange('status', value)}
            className="w-full"
            size="large"
          >
            <Select.Option value="in_progress">In Progress</Select.Option>
            <Select.Option value="closed">Closed</Select.Option>
            <Select.Option value="not_closed">Not Closed</Select.Option>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
          <Select
            value={formData.source}
            onChange={(value) => handleChange('source', value)}
            className="w-full"
            size="large"
          >
            <Select.Option value="website">🌐 Website</Select.Option>
            <Select.Option value="referral">👥 Referral</Select.Option>
            <Select.Option value="social_media">📱 Social Media</Select.Option>
            <Select.Option value="cold_call">📞 Cold Call</Select.Option>
            <Select.Option value="email">📧 Email</Select.Option>
            <Select.Option value="fiverr">💼 Fiverr</Select.Option>
            <Select.Option value="upwork">💻 Upwork</Select.Option>
            <Select.Option value="whatsapp">💬 WhatsApp</Select.Option>
            <Select.Option value="other">📋 Other</Select.Option>
          </Select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Possibility of Closing (%)</label>
        <Input
          type="number"
          value={formData.closing_percentage || 0}
          onChange={(e) => {
            const value = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
            handleChange('closing_percentage', value);
          }}
          suffix="%"
          size="large"
          min={0}
          max={100}
          placeholder="0-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
        <TextArea
          value={formData.remarks}
          onChange={(e) => handleChange('remarks', e.target.value)}
          placeholder="Add any remarks about this lead..."
          rows={4}
          size="large"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Last Followup Date</label>
        <Input
          type="date"
          value={formData.last_followup_date}
          onChange={(e) => handleChange('last_followup_date', e.target.value)}
          size="large"
        />
      </div>

      <div className="flex justify-between pt-6 border-t">
        {lead && (
          <Button danger onClick={handleDelete} size="large">
            Archive Lead
          </Button>
        )}
        <div className={`flex gap-3 ${!lead ? 'ml-auto' : ''}`}>
          <Button onClick={onClose} size="large">
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={handleSave}
            loading={saving}
            size="large"
            style={{ backgroundColor: '#2563eb' }}
          >
            {lead ? 'Update' : 'Create'} Lead
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Leads;
