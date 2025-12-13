-- Resosyncer Company Management System Database Schema
-- Creates complete database structure supporting Admin, Project Manager, and Employee roles

-- 1. Teams Table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Profiles Table (Extended user information)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'project_manager', 'employee')),
  contact text,
  cnic text,
  dob date,
  address text,
  github_username text,
  bank_account_details jsonb DEFAULT '{}'::jsonb,
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  user_photo text,
  salary_type text CHECK (salary_type IN ('fixed', 'base_commission')),
  salary_amount numeric DEFAULT 0,
  base_salary numeric DEFAULT 0,
  commission_rate numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_date date,
  end_date date,
  project_type text CHECK (project_type IN ('single', 'milestone')),
  status text DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'testing', 'completed')),
  github_repo text,
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  client_name text,
  client_email text,
  client_phone text,
  client_country text,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Milestones Table
CREATE TABLE IF NOT EXISTS milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date,
  end_date date,
  work_description text,
  created_at timestamptz DEFAULT now()
);

-- 5. Project Employees Junction Table
CREATE TABLE IF NOT EXISTS project_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(project_id, employee_id)
);

-- 6. Tickets Table
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'closed')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 7. Requests Table
CREATE TABLE IF NOT EXISTS requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  request_type text NOT NULL CHECK (request_type IN ('leave', 'advance_salary', 'other')),
  subject text NOT NULL,
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  response text,
  responded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  responded_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 8. Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  hours_worked numeric DEFAULT 0,
  status text DEFAULT 'absent' CHECK (status IN ('present', 'absent', 'leave')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- 9. Leads Table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  company text,
  country text,
  status text DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  notes text,
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 10. Documents Table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('folder', 'file')),
  parent_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  file_url text,
  file_size bigint,
  mime_type text,
  uploaded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 11. Channels Table
CREATE TABLE IF NOT EXISTS channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_private boolean DEFAULT false,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- 12. Channel Members Table
CREATE TABLE IF NOT EXISTS channel_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

-- 13. Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid REFERENCES channels(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 14. Payslips Table
CREATE TABLE IF NOT EXISTS payslips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  year integer NOT NULL,
  base_salary numeric DEFAULT 0,
  commission numeric DEFAULT 0,
  deductions numeric DEFAULT 0,
  net_salary numeric DEFAULT 0,
  generated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, month, year)
);

-- Enable Row Level Security
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager')));

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Teams Policies
CREATE POLICY "Authenticated users can view teams"
  ON teams FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage teams"
  ON teams FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Projects Policies
CREATE POLICY "Users can view projects"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and PMs can manage projects"
  ON projects FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager')));

-- Milestones Policies
CREATE POLICY "Users can view milestones"
  ON milestones FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and PMs can manage milestones"
  ON milestones FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager')));

-- Project Employees Policies
CREATE POLICY "Users can view project assignments"
  ON project_employees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and PMs can manage project assignments"
  ON project_employees FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager')));

-- Tickets Policies
CREATE POLICY "Users can view relevant tickets"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    assigned_to = auth.uid() OR 
    created_by = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager'))
  );

CREATE POLICY "Users can create tickets"
  ON tickets FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update assigned tickets"
  ON tickets FOR UPDATE
  TO authenticated
  USING (
    assigned_to = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager'))
  )
  WITH CHECK (
    assigned_to = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager'))
  );

CREATE POLICY "Admins and PMs can delete tickets"
  ON tickets FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager')));

-- Requests Policies
CREATE POLICY "Users can view own requests"
  ON requests FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager'))
  );

CREATE POLICY "Users can create requests"
  ON requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can respond to requests"
  ON requests FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Attendance Policies
CREATE POLICY "Users can view own attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager'))
  );

CREATE POLICY "Users can create own attendance"
  ON attendance FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own attendance"
  ON attendance FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Leads Policies
CREATE POLICY "Users can view leads"
  ON leads FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and PMs can manage leads"
  ON leads FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager')));

-- Documents Policies
CREATE POLICY "Users can view documents"
  ON documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage documents"
  ON documents FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Channels Policies
CREATE POLICY "Users can view channels they are members of"
  ON channels FOR SELECT
  TO authenticated
  USING (
    NOT is_private OR 
    EXISTS (SELECT 1 FROM channel_members WHERE channel_id = channels.id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage channels"
  ON channels FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Channel Members Policies
CREATE POLICY "Users can view channel members"
  ON channel_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage channel members"
  ON channel_members FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Messages Policies
CREATE POLICY "Users can view messages in their channels"
  ON messages FOR SELECT
  TO authenticated
  USING (
    sender_id = auth.uid() OR
    receiver_id = auth.uid() OR
    EXISTS (SELECT 1 FROM channel_members WHERE channel_id = messages.channel_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- Payslips Policies
CREATE POLICY "Users can view own payslips"
  ON payslips FOR SELECT
  TO authenticated
  USING (
    employee_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage payslips"
  ON payslips FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_team_id ON profiles(team_id);
CREATE INDEX IF NOT EXISTS idx_projects_team_id ON projects(team_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_employees_project_id ON project_employees(project_id);
CREATE INDEX IF NOT EXISTS idx_project_employees_employee_id ON project_employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_tickets_project_id ON tickets(project_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_requests_user_id ON requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_documents_parent_id ON documents(parent_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_channel_id ON channel_members(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_user_id ON channel_members(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_payslips_employee_id ON payslips(employee_id);