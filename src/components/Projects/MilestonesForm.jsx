import { Form, Input, DatePicker, Button, Card, Space } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { TextArea } = Input;

const MilestonesForm = ({ form, milestones, setMilestones, projectType }) => {
  const addMilestone = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue();
      setMilestones([...milestones, { ...values, id: Date.now() }]);
      form.resetFields();
    } catch (error) {
      console.log('Validation failed:', error);
    }
  };

  const removeMilestone = (id) => {
    setMilestones(milestones.filter(m => m.id !== id));
  };

  if (projectType !== 'milestone') {
    return (
      <div className="text-center py-8 text-gray-500">
        Milestones are only available for milestone-based projects
      </div>
    );
  }

  return (
    <div>
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="Milestone Name"
          rules={[{ required: true, message: 'Please enter milestone name' }]}
        >
          <Input placeholder="Enter milestone name" />
        </Form.Item>

        <Form.Item
          name="start_date"
          label="Start Date"
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="end_date"
          label="End Date"
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="work_description"
          label="Work Description"
        >
          <TextArea rows={3} placeholder="Describe the work for this milestone" />
        </Form.Item>

        <Form.Item>
          <Button
            type="dashed"
            onClick={addMilestone}
            block
            icon={<PlusOutlined />}
          >
            Add Milestone
          </Button>
        </Form.Item>
      </Form>

      {milestones.length > 0 && (
        <div className="mt-4">
          <h4 className="mb-3 font-semibold">Added Milestones ({milestones.length})</h4>
          <Space direction="vertical" style={{ width: '100%' }}>
            {milestones.map((milestone) => (
              <Card
                key={milestone.id}
                size="small"
                extra={
                  <Button
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeMilestone(milestone.id)}
                  />
                }
              >
                <div className="font-semibold">{milestone.name}</div>
                {milestone.start_date && milestone.end_date && (
                  <div className="text-sm text-gray-500">
                    {milestone.start_date.format('MMM DD, YYYY')} - {milestone.end_date.format('MMM DD, YYYY')}
                  </div>
                )}
                {milestone.work_description && (
                  <div className="text-sm mt-2">{milestone.work_description}</div>
                )}
              </Card>
            ))}
          </Space>
        </div>
      )}
    </div>
  );
};

export default MilestonesForm;
