import { useState, useEffect } from 'react';
import { Modal, Steps, Form, Input, Select, DatePicker, Button, message, Space, Progress } from 'antd';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';
import MilestonesForm from './MilestonesForm';
import CountrySelect from '../CountrySelect';

const { TextArea } = Input;

const AddProjectModal = ({ visible, onClose, project }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [milestonesForm] = Form.useForm();
  const [clientForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState([]);
  const [projectManagers, setProjectManagers] = useState([]);
  const [projectType, setProjectType] = useState('single');
  const [milestones, setMilestones] = useState([]);
  const { profile } = useAuth();

  useEffect(() => {
    if (visible) {
      fetchTeams();
      fetchProjectManagers();
      if (project) {
        form.setFieldsValue({
          ...project,
          start_date: project.start_date ? dayjs(project.start_date) : null,
          end_date: project.end_date ? dayjs(project.end_date) : null,
        });
        setProjectType(project.project_type);
      } else {
        form.resetFields();
        milestonesForm.resetFields();
        clientForm.resetFields();
        setCurrentStep(0);
        setMilestones([]);
      }
    }
  }, [visible, project]);

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name');

      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const fetchProjectManagers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'project_manager')
        .order('full_name');

      if (error) throw error;
      setProjectManagers(data || []);
    } catch (error) {
      console.error('Error fetching project managers:', error);
    }
  };

  const handleNext = async () => {
    try {
      if (currentStep === 0) {
        await form.validateFields();
        const values = form.getFieldsValue();
        setProjectType(values.project_type);
      }
      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.log('Validation failed:', error);
    }
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!profile?.id && !project) {
      message.error('Please wait for profile to load');
      return;
    }

    try {
      setLoading(true);

      await clientForm.validateFields();
      const projectData = form.getFieldsValue();
      const clientData = clientForm.getFieldsValue();

      const projectPayload = {
        name: projectData.name,
        start_date: projectData.start_date ? projectData.start_date.format('YYYY-MM-DD') : null,
        end_date: projectData.end_date ? projectData.end_date.format('YYYY-MM-DD') : null,
        project_type: projectData.project_type,
        status: projectData.status,
        github_repo: projectData.github_repo,
        team_id: projectData.team_id,
        project_manager_id: projectData.project_manager_id,
        client_name: clientData.client_name,
        client_email: clientData.client_email,
        client_phone: clientData.client_phone,
        client_country: clientData.client_country,
        created_by: project ? project.created_by : profile.id,
      };

      let projectId;
      if (project) {
        const { error } = await supabase
          .from('projects')
          .update(projectPayload)
          .eq('id', project.id);

        if (error) throw error;
        projectId = project.id;
        message.success('Project updated successfully');
      } else {
        const { data, error } = await supabase
          .from('projects')
          .insert([projectPayload])
          .select()
          .single();

        if (error) throw error;
        projectId = data.id;

        if (projectData.project_type === 'milestone' && milestones.length > 0) {
          const milestonesPayload = milestones.map(m => ({
            project_id: projectId,
            name: m.name,
            start_date: m.start_date ? m.start_date.format('YYYY-MM-DD') : null,
            end_date: m.end_date ? m.end_date.format('YYYY-MM-DD') : null,
            work_description: m.work_description,
          }));

          const { error: milestonesError } = await supabase
            .from('milestones')
            .insert(milestonesPayload);

          if (milestonesError) throw milestonesError;
        }

        if (projectData.project_manager_id) {
          const pmData = projectManagers.find(pm => pm.id === projectData.project_manager_id);
          if (pmData) {
            console.log('Project assigned to:', pmData.full_name);
          }
        }

        message.success('Project created successfully');
      }

      form.resetFields();
      milestonesForm.resetFields();
      clientForm.resetFields();
      setCurrentStep(0);
      setMilestones([]);
      onClose(true);
    } catch (error) {
      message.error('Failed to save project');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: 'Project Details',
      content: (
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Project Name"
            rules={[{ required: true, message: 'Please enter project name' }]}
          >
            <Input placeholder="Enter project name" />
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
            name="project_type"
            label="Project Type"
            rules={[{ required: true, message: 'Please select project type' }]}
          >
            <Select
              placeholder="Select type"
              onChange={(value) => setProjectType(value)}
            >
              <Select.Option value="single">Single</Select.Option>
              <Select.Option value="milestone">Milestone</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select placeholder="Select status">
              <Select.Option value="not_started">Not Started Yet</Select.Option>
              <Select.Option value="in_progress">In Progress</Select.Option>
              <Select.Option value="testing">Testing</Select.Option>
              <Select.Option value="completed">Completed</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="project_manager_id"
            label="Project Manager"
            rules={[{ required: true, message: 'Please select project manager' }]}
          >
            <Select placeholder="Select project manager" showSearch filterOption={(input, option) =>
              option.children.toLowerCase().includes(input.toLowerCase())
            }>
              {projectManagers.map(pm => (
                <Select.Option key={pm.id} value={pm.id}>
                  {pm.full_name} ({pm.email})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="github_repo"
            label="Github Repository"
          >
            <Input placeholder="Enter github repo URL" />
          </Form.Item>

          <Form.Item
            name="team_id"
            label="Team"
          >
            <Select placeholder="Select team" allowClear>
              {teams.map(team => (
                <Select.Option key={team.id} value={team.id}>
                  {team.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="remarks"
            label="Remarks"
          >
            <TextArea placeholder="Add any remarks about this project..." rows={4} />
          </Form.Item>
        </Form>
      ),
    },
    {
      title: 'Milestones',
      content: (
        <MilestonesForm
          form={milestonesForm}
          milestones={milestones}
          setMilestones={setMilestones}
          projectType={projectType}
        />
      ),
    },
    {
      title: 'Client Details',
      content: (
        <Form form={clientForm} layout="vertical">
          <Form.Item
            name="client_name"
            label="Client Name"
          >
            <Input placeholder="Enter client name" />
          </Form.Item>

          <Form.Item
            name="client_email"
            label="Client Email"
            rules={[{ type: 'email', message: 'Please enter valid email' }]}
          >
            <Input placeholder="Enter client email" />
          </Form.Item>

          <Form.Item
            name="client_phone"
            label="Client Phone"
          >
            <Input placeholder="Enter client phone" />
          </Form.Item>

          <Form.Item
            name="client_country"
            label="Client Country"
          >
            <CountrySelect placeholder="Select client country" />
          </Form.Item>
        </Form>
      ),
    },
  ];

  const progressPercent = ((currentStep + 1) / steps.length) * 100;

  return (
    <Modal
      title={project ? 'Edit Project' : 'Add New Project'}
      open={visible}
      onCancel={() => {
        form.resetFields();
        milestonesForm.resetFields();
        clientForm.resetFields();
        setCurrentStep(0);
        setMilestones([]);
        onClose(false);
      }}
      footer={null}
      width={800}
      destroyOnClose
    >
      <Progress
        percent={progressPercent}
        showInfo={false}
        strokeColor="#001529"
        className="mb-4"
      />

      <Steps current={currentStep} className="mb-6" size="small">
        {steps.map((item, index) => (
          <Steps.Step key={item.title} title={item.title} />
        ))}
      </Steps>

      <div className="mb-6">{steps[currentStep].content}</div>

      <div className="flex justify-end gap-2">
        {currentStep > 0 && (
          <Button onClick={handlePrev}>Previous</Button>
        )}
        {currentStep < steps.length - 1 && (
          <Button type="primary" onClick={handleNext}>
            Next
          </Button>
        )}
        {currentStep === steps.length - 1 && (
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            {project ? 'Update' : 'Create'} Project
          </Button>
        )}
      </div>
    </Modal>
  );
};

export default AddProjectModal;
