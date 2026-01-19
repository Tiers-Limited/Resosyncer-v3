import { useState, useEffect } from 'react';
import { Button, message, Select, Input, Form, Card, DatePicker, Space, Divider, Modal } from 'antd';
import { FileTextOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabase';
import dayjs from 'dayjs';

const { TextArea } = Input;

const LOGO_BASE64 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzE4OTBmZiIvPgogIDx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjQwIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlQ8L3RleHQ+Cjwvc3ZnPg==';

const LetterGeneration = () => {
  const [form] = Form.useForm();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [letterType, setLetterType] = useState('offer');
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [logoBase64, setLogoBase64] = useState(LOGO_BASE64);

  useEffect(() => {
    fetchEmployees();
    loadLogo();
  }, []);

  const loadLogo = () => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        setLogoBase64(dataURL);
      } catch (error) {
        console.log('Failed to convert logo, using default');
      }
    };
    img.onerror = () => {
      console.log('Failed to load logo, using default');
    };
    img.src = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQnxHPOKHeX6zFXYDVgi_mh0ih9388-j6e4mQ&s';
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, job_title, department, phone, address, cnic')
        .order('full_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      message.error('Failed to fetch employees');
    }
  };

  const generateOfferLetter = (values) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Offer Letter - ${values.candidateName}</title>
        <style>
          @page {
            size: A4;
            margin: 0;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Times New Roman', Times, serif;
            line-height: 1.6;
            color: #000;
            background: white;
            padding: 60px 80px;
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
          }
          .logo-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
          }
          .logo {
            width: 80px;
            height: 80px;
          }
          .logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          .header {
            text-align: right;
            font-size: 14px;
          }
          .company-name {
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 5px;
          }
          .date {
            text-align: right;
            margin-bottom: 40px;
            font-size: 14px;
          }
          .recipient {
            margin-bottom: 30px;
            font-size: 14px;
          }
          .salutation {
            margin-bottom: 20px;
            font-size: 14px;
          }
          .content {
            font-size: 14px;
            text-align: justify;
          }
          .content p {
            margin-bottom: 15px;
          }
          .details {
            margin: 20px 0;
            padding-left: 20px;
          }
          .details li {
            margin-bottom: 8px;
          }
          .signature-section {
            margin-top: 80px;
            display: flex;
            justify-content: space-between;
          }
          .signature-box {
            text-align: center;
          }
          .signature-line {
            width: 200px;
            margin-bottom: 5px;
          }
          .stamp {
            position: absolute;
            right: 80px;
            bottom: 150px;
            opacity: 0.7;
          }
          @media print {
            body {
              padding: 60px 80px;
            }
          }
        </style>
      </head>
      <body>
        <div class="logo-header">
          <div class="logo">
            <img src="${logoBase64}" alt="TIERS Limited" />
          </div>
          <div class="header">
            <div class="company-name">TIERS Limited</div>
            <div>Main Boston Area, Massachusetts, USA</div>
            <div>info@tierssolutionslimited.com</div>
          </div>
        </div>

        <div class="date">${dayjs(values.date).format('DD/MM/YYYY')}</div>

        <div class="recipient">
          <div>${values.candidateName}</div>
          ${values.candidateCnic ? `<div>${values.candidateCnic}</div>` : ''}
          ${values.candidateAddress ? `<div>Home Address: ${values.candidateAddress}</div>` : ''}
        </div>

        <div class="salutation">Dear ${values.candidateName},</div>

        <div class="content">
          <p>We are pleased to offer you the position of <strong>${values.jobTitle}</strong> at TIERS Limited. We are confident that your technical skills, dedication, and passion for software development will contribute positively to our team. We look forward to working with you.</p>

          <p>Your employment details are as follows:</p>

          <div class="details">
            <ul>
              <li><strong>Position:</strong> ${values.jobTitle}</li>
              <li><strong>Monthly Salary:</strong> ${values.salary}</li>
              <li><strong>Employment Type:</strong> ${values.employmentType || 'Full-time'}</li>
              ${values.probationPeriod ? `<li><strong>Probation Period:</strong> ${values.probationPeriod}</li>` : ''}
              ${values.minimumCommitment ? `<li><strong>Minimum Commitment:</strong> ${values.minimumCommitment}</li>` : ''}
              ${values.noticePeriod ? `<li><strong>Notice Period:</strong> ${values.noticePeriod}</li>` : ''}
            </ul>
          </div>

          ${values.additionalTerms ? `<p>${values.additionalTerms}</p>` : ''}

          <p>Please acknowledge your acceptance of this offer by signing and returning a copy of this letter.</p>
        </div>

        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-line">_____________________________</div>
            <div>${values.candidateName}</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">_____________________________</div>
            <div>${values.signerName || 'Shoaib Rafique'}</div>
            <div>${values.signerTitle || 'Founder & CEO'}</div>
          </div>
        </div>
      </body>
      </html>
    `;
    return html;
  };

  const generateExperienceLetter = (values) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Experience Certificate - ${values.employeeName}</title>
        <style>
          @page {
            size: A4;
            margin: 0;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Times New Roman', Times, serif;
            line-height: 1.6;
            color: #000;
            background: white;
            padding: 60px 80px;
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
          }
          .logo-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
          }
          .logo {
            width: 80px;
            height: 80px;
          }
          .logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          .header {
            text-align: right;
            font-size: 14px;
          }
          .company-name {
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 5px;
          }
          .date {
            text-align: right;
            margin-bottom: 40px;
            font-size: 14px;
          }
          .title {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 40px;
          }
          .content {
            font-size: 14px;
            text-align: justify;
          }
          .content p {
            margin-bottom: 15px;
          }
          .responsibilities, .achievements {
            margin: 20px 0;
            padding-left: 20px;
          }
          .signature-section {
            margin-top: 80px;
          }
          .signature-line {
            width: 250px;
            border-top: 1px solid #000;
            margin-top: 60px;
            margin-bottom: 10px;
          }
          @media print {
            body {
              padding: 60px 80px;
            }
          }
        </style>
      </head>
      <body>
        <div class="logo-header">
          <div class="logo">
            <img src="${logoBase64}" alt="TIERS Limited" />
          </div>
          <div class="header">
            <div class="company-name">TIERS Limited</div>
            <div>Main Boston Area, Massachusetts, USA</div>
            <div>info@tierssolutionslimited.com</div>
          </div>
        </div>

        <div class="date">${dayjs(values.date).format('DD/MM/YYYY')}</div>

        <div class="title">TO WHOM IT MAY CONCERN</div>

        <div class="content">
          <p>This is to certify that <strong>${values.employeeName}</strong> ${values.employeeCnic ? `(CNIC: ${values.employeeCnic})` : ''} was employed with TIERS Limited from <strong>${dayjs(values.joinDate).format('MMMM DD, YYYY')}</strong> to <strong>${dayjs(values.relievingDate).format('MMMM DD, YYYY')}</strong>.</p>

          <p>During the tenure with us, ${values.employeeName} held the position of <strong>${values.jobTitle}</strong>${values.department ? ` in the <strong>${values.department}</strong> department` : ''}.</p>

          ${values.responsibilities ? `
          <p><strong>Key Responsibilities:</strong></p>
          <div class="responsibilities">
            <p>${values.responsibilities.replace(/\n/g, '<br>')}</p>
          </div>
          ` : ''}

          ${values.achievements ? `
          <p><strong>Notable Achievements:</strong></p>
          <div class="achievements">
            <p>${values.achievements.replace(/\n/g, '<br>')}</p>
          </div>
          ` : ''}

          <p>${values.employeeName} was a valuable member of our team and contributed significantly to our organization. We found ${values.employeeName.split(' ')[0]} to be hardworking, dedicated, and professional in all aspects of work.</p>

          <p>We wish ${values.employeeName.split(' ')[0]} all the best in future endeavors.</p>

          <div class="signature-section">
            <p>For TIERS Limited,</p>
            <div class="signature-line"></div>
            <p><strong>${values.signerName || 'Shoaib Rafique'}</strong></p>
            <p>${values.signerTitle || 'Founder & CEO'}</p>
          </div>
        </div>
      </body>
      </html>
    `;
    return html;
  };

  const handlePreview = () => {
    form.validateFields().then(values => {
      const html = letterType === 'offer'
        ? generateOfferLetter(values)
        : generateExperienceLetter(values);
      setPreviewHtml(html);
      setPreviewModalOpen(true);
    }).catch(() => {
      message.error('Please fill in all required fields');
    });
  };

  const handleDownloadPDF = async () => {
    try {
      const values = await form.validateFields();
      const html = letterType === 'offer'
        ? generateOfferLetter(values)
        : generateExperienceLetter(values);

      const printWindow = window.open('', '', 'width=800,height=600');
      printWindow.document.write(html);
      printWindow.document.close();

      setTimeout(() => {
        printWindow.print();
      }, 250);

      message.success('Opening print dialog. Save as PDF from the print dialog.');
    } catch (error) {
      message.error('Please fill in all required fields');
    }
  };

  const handleEmployeeSelect = (employeeId) => {
    const employee = employees.find(e => e.id === employeeId);
    if (employee) {
      if (letterType === 'offer') {
        form.setFieldsValue({
          candidateName: employee.full_name,
          jobTitle: employee.job_title,
          department: employee.department,
          candidateCnic: employee.cnic,
          candidateAddress: employee.address,
        });
      } else {
        form.setFieldsValue({
          employeeName: employee.full_name,
          jobTitle: employee.job_title,
          department: employee.department,
          employeeCnic: employee.cnic,
        });
      }
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FileTextOutlined className="text-2xl" />
            <h1 className="text-2xl font-semibold m-0">Letter Generation</h1>
          </div>
        </div>

        <Card className="shadow-sm">
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              date: dayjs(),
              letterType: 'offer',
              employmentType: 'Full-time',
              probationPeriod: '3 months',
              minimumCommitment: '3 months',
              noticePeriod: 'You must provide a one-month written notice before resigning from your position.',
            }}
          >
            <Form.Item
              label="Letter Type"
              name="letterType"
              rules={[{ required: true }]}
            >
              <Select
                value={letterType}
                onChange={setLetterType}
                options={[
                  { label: 'Offer Letter', value: 'offer' },
                  { label: 'Experience Certificate', value: 'experience' },
                ]}
              />
            </Form.Item>

            <Form.Item label="Select Employee (Optional)">
              <Select
                showSearch
                allowClear
                placeholder="Search employee..."
                onChange={handleEmployeeSelect}
                filterOption={(input, option) =>
                  option.label.toLowerCase().includes(input.toLowerCase())
                }
                options={employees.map(e => ({
                  label: `${e.full_name} - ${e.job_title || 'N/A'}`,
                  value: e.id,
                }))}
              />
            </Form.Item>

            <Divider />

            <Form.Item
              label="Date"
              name="date"
              rules={[{ required: true }]}
            >
              <DatePicker className="w-full" />
            </Form.Item>

            {letterType === 'offer' ? (
              <>
                <Form.Item
                  label="Candidate Name"
                  name="candidateName"
                  rules={[{ required: true }]}
                >
                  <Input placeholder="Enter candidate name" />
                </Form.Item>

                <Form.Item
                  label="Candidate CNIC"
                  name="candidateCnic"
                >
                  <Input placeholder="e.g., 35202-3081283-1" />
                </Form.Item>

                <Form.Item
                  label="Candidate Address"
                  name="candidateAddress"
                >
                  <TextArea rows={2} placeholder="Enter home address" />
                </Form.Item>

                <Form.Item
                  label="Job Title"
                  name="jobTitle"
                  rules={[{ required: true }]}
                >
                  <Input placeholder="e.g., .NET Framework Developer" />
                </Form.Item>

                <Form.Item
                  label="Monthly Salary"
                  name="salary"
                  rules={[{ required: true }]}
                >
                  <Input placeholder="e.g., PKR 50,000 (Fifty Thousand Rupees)" />
                </Form.Item>

                <Form.Item
                  label="Employment Type"
                  name="employmentType"
                >
                  <Select
                    options={[
                      { label: 'Full-time', value: 'Full-time' },
                      { label: 'Part-time', value: 'Part-time' },
                      { label: 'Contract', value: 'Contract' },
                      { label: 'Internship', value: 'Internship' },
                    ]}
                  />
                </Form.Item>

                <Form.Item
                  label="Probation Period"
                  name="probationPeriod"
                >
                  <Input placeholder="e.g., 3 months" />
                </Form.Item>

                <Form.Item
                  label="Minimum Commitment"
                  name="minimumCommitment"
                >
                  <Input placeholder="e.g., 3 months" />
                </Form.Item>

                <Form.Item
                  label="Notice Period"
                  name="noticePeriod"
                >
                  <TextArea rows={2} placeholder="e.g., You must provide a one-month written notice..." />
                </Form.Item>

                <Form.Item
                  label="Additional Terms"
                  name="additionalTerms"
                >
                  <TextArea rows={3} placeholder="Any additional terms or conditions..." />
                </Form.Item>
              </>
            ) : (
              <>
                <Form.Item
                  label="Employee Name"
                  name="employeeName"
                  rules={[{ required: true }]}
                >
                  <Input placeholder="Enter employee name" />
                </Form.Item>

                <Form.Item
                  label="Employee CNIC"
                  name="employeeCnic"
                >
                  <Input placeholder="e.g., 35202-3081283-1" />
                </Form.Item>

                <Form.Item
                  label="Job Title"
                  name="jobTitle"
                  rules={[{ required: true }]}
                >
                  <Input placeholder="Enter job title" />
                </Form.Item>

                <Form.Item
                  label="Department"
                  name="department"
                >
                  <Input placeholder="Enter department" />
                </Form.Item>

                <Form.Item
                  label="Joining Date"
                  name="joinDate"
                  rules={[{ required: true }]}
                >
                  <DatePicker className="w-full" />
                </Form.Item>

                <Form.Item
                  label="Relieving Date"
                  name="relievingDate"
                  rules={[{ required: true }]}
                >
                  <DatePicker className="w-full" />
                </Form.Item>

                <Form.Item
                  label="Key Responsibilities"
                  name="responsibilities"
                >
                  <TextArea rows={4} placeholder="Enter key responsibilities..." />
                </Form.Item>

                <Form.Item
                  label="Notable Achievements"
                  name="achievements"
                >
                  <TextArea rows={4} placeholder="Enter notable achievements..." />
                </Form.Item>
              </>
            )}

            <Divider />

            <Form.Item
              label="Signer Name"
              name="signerName"
            >
              <Input placeholder="Default: Shoaib Rafique" />
            </Form.Item>

            <Form.Item
              label="Signer Title"
              name="signerTitle"
            >
              <Input placeholder="Default: Founder & CEO" />
            </Form.Item>

            <Space className="w-full justify-end mt-4">
              <Button
                icon={<EyeOutlined />}
                onClick={handlePreview}
              >
                Preview
              </Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleDownloadPDF}
                loading={loading}
              >
                Download PDF
              </Button>
            </Space>
          </Form>
        </Card>
      </div>

      <Modal
        title="Letter Preview"
        open={previewModalOpen}
        onCancel={() => setPreviewModalOpen(false)}
        width="90%"
        style={{ top: 20 }}
        footer={[
          <Button key="close" onClick={() => setPreviewModalOpen(false)}>
            Close
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleDownloadPDF}
          >
            Download PDF
          </Button>
        ]}
      >
        <div
          style={{
            height: 'calc(100vh - 200px)',
            overflow: 'auto',
            backgroundColor: '#f5f5f5',
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              boxShadow: '0 0 10px rgba(0,0,0,0.1)',
              margin: '0 auto'
            }}
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default LetterGeneration;
