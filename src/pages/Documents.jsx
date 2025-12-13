import { useState, useEffect } from 'react';
import { Card, Table, Button, Space, message, Modal, Form, Input, Select, Upload, Popconfirm } from 'antd';
import { PlusOutlined, FolderOutlined, FileOutlined, FolderAddOutlined, UploadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [folderPath, setFolderPath] = useState([]);
  const [loading, setLoading] = useState(false);
  const [folderModal, setFolderModal] = useState(false);
  const [uploadModal, setUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [editingFolder, setEditingFolder] = useState(null);
  const [form] = Form.useForm();
  const { profile } = useAuth();

  useEffect(() => {
    fetchDocuments();
  }, [currentFolder]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('documents')
        .select('*')
        .order('type', { ascending: false })
        .order('name');

      if (currentFolder) {
        query = query.eq('parent_id', currentFolder);
      } else {
        query = query.is('parent_id', null);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      message.error('Failed to fetch documents');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async (values) => {
    if (!profile?.id && !editingFolder) {
      message.error('Please wait for profile to load');
      return;
    }

    setLoading(true);
    try {
      if (editingFolder) {
        const { error } = await supabase
          .from('documents')
          .update({ name: values.name })
          .eq('id', editingFolder.id);

        if (error) throw error;
        message.success('Folder updated successfully');
      } else {
        const { error } = await supabase
          .from('documents')
          .insert([{
            name: values.name,
            type: 'folder',
            parent_id: currentFolder,
            uploaded_by: profile.id,
          }]);

        if (error) throw error;
        message.success('Folder created successfully');
      }

      setFolderModal(false);
      setEditingFolder(null);
      form.resetFields();
      fetchDocuments();
    } catch (error) {
      message.error(editingFolder ? 'Failed to update folder' : 'Failed to create folder');
    } finally {
      setLoading(false);
    }
  };

  const handleFolderClick = async (folder) => {
    setFolderPath([...folderPath, { id: folder.id, name: folder.name, parent_id: folder.parent_id }]);
    setCurrentFolder(folder.id);
  };

  const handleBack = async () => {
    if (folderPath.length > 0) {
      const newPath = [...folderPath];
      newPath.pop();

      if (newPath.length > 0) {
        const parent = newPath[newPath.length - 1];
        setCurrentFolder(parent.id);
      } else {
        setCurrentFolder(null);
      }

      setFolderPath(newPath);
    }
  };

  const handleUpload = async () => {
    if (!profile?.id) {
      message.error('Please wait for profile to load');
      return;
    }

    if (fileList.length === 0) {
      message.error('Please select a file to upload');
      return;
    }

    setUploading(true);
    try {
      const file = fileList[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('documents')
        .insert([{
          name: file.name,
          type: 'file',
          file_url: fileName,
          file_size: file.size,
          parent_id: currentFolder,
          uploaded_by: profile.id,
        }]);

      if (dbError) throw dbError;

      message.success('File uploaded successfully');
      setUploadModal(false);
      setFileList([]);
      fetchDocuments();
    } catch (error) {
      console.error('Error uploading file:', error);
      message.error(error.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (record) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(record.file_url);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = record.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      message.error('Failed to download file');
    }
  };

  const handleEditFolder = (record) => {
    setEditingFolder(record);
    form.setFieldsValue({ name: record.name });
    setFolderModal(true);
  };

  const handleDeleteDocument = async (record) => {
    setLoading(true);
    try {
      if (record.type === 'file' && record.file_url) {
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([record.file_url]);

        if (storageError) throw storageError;
      }

      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', record.id);

      if (error) throw error;

      message.success(`${record.type === 'folder' ? 'Folder' : 'Document'} deleted successfully`);
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting:', error);
      message.error('Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          {record.type === 'folder' ? (
            <FolderOutlined style={{ fontSize: 18, color: '#001529' }} />
          ) : (
            <FileOutlined style={{ fontSize: 18 }} />
          )}
          {record.type === 'folder' ? (
            <a onClick={() => handleFolderClick(record)}>{text}</a>
          ) : (
            <a onClick={() => handleDownload(record)}>{text}</a>
          )}
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => type === 'folder' ? 'Folder' : 'File',
    },
    {
      title: 'Size',
      dataIndex: 'file_size',
      key: 'file_size',
      render: (size) => size ? `${(size / 1024).toFixed(2)} KB` : '-',
    },
    {
      title: 'Uploaded At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.type === 'folder' && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditFolder(record)}
            >
              Edit
            </Button>
          )}
          <Popconfirm
            title={`Delete this ${record.type}?`}
            description="This action cannot be undone."
            onConfirm={() => handleDeleteDocument(record)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="link"
              danger
              size="small"
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Documents</h1>
            {currentFolder && (
              <Button onClick={handleBack}>Back</Button>
            )}
          </div>
          {folderPath.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="cursor-pointer hover:text-blue-600" onClick={() => { setCurrentFolder(null); setFolderPath([]); }}>
                Documents
              </span>
              {folderPath.map((folder, index) => (
                <span key={folder.id}>
                  <span className="mx-1">/</span>
                  <span className="cursor-pointer hover:text-blue-600" onClick={() => {
                    const newPath = folderPath.slice(0, index + 1);
                    setFolderPath(newPath);
                    setCurrentFolder(folder.id);
                  }}>
                    {folder.name}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
        <Space>
          <Button
            icon={<FolderAddOutlined />}
            onClick={() => setFolderModal(true)}
          >
            New Folder
          </Button>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => setUploadModal(true)}
            style={{ backgroundColor: '#001529' }}
          >
            Upload File
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={documents}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 15,
            showTotal: (total) => `Total ${total} items`,
          }}
        />
      </Card>

      <Modal
        title={editingFolder ? 'Edit Folder' : 'Create New Folder'}
        open={folderModal}
        onCancel={() => {
          setFolderModal(false);
          setEditingFolder(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={loading}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateFolder}
        >
          <Form.Item
            name="name"
            label="Folder Name"
            rules={[{ required: true, message: 'Please enter folder name' }]}
          >
            <Input placeholder="Enter folder name" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Upload File"
        open={uploadModal}
        onCancel={() => {
          setUploadModal(false);
          setFileList([]);
        }}
        onOk={handleUpload}
        confirmLoading={uploading}
      >
        <Upload
          beforeUpload={(file) => {
            setFileList([file]);
            return false;
          }}
          onRemove={() => setFileList([])}
          fileList={fileList}
          maxCount={1}
        >
          <Button icon={<UploadOutlined />}>Select File</Button>
        </Upload>
      </Modal>
    </div>
  );
};

export default Documents;
