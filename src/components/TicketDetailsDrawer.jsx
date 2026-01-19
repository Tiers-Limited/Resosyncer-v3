import { useState, useEffect } from 'react';
import { Drawer, Button, Tag, Input, List, Avatar, Space, message, Divider, Card, Modal } from 'antd';
import { UserOutlined, SendOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { TextArea } = Input;

const TicketDetailsDrawer = ({ visible, onClose, ticket, onUpdate }) => {
  const { profile } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [completionRequest, setCompletionRequest] = useState(null);
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewAction, setReviewAction] = useState(null);

  useEffect(() => {
    if (visible && ticket?.id) {
      fetchComments();
      fetchCompletionRequest();
    }
  }, [visible, ticket?.id]);

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from('ticket_comments')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            role,
            user_photo
          )
        `)
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const fetchCompletionRequest = async () => {
    try {
      const { data, error } = await supabase
        .from('ticket_completion_requests')
        .select(`
          *,
          requester:requested_by (
            id,
            full_name,
            user_photo
          ),
          reviewer:reviewed_by (
            id,
            full_name
          )
        `)
        .eq('ticket_id', ticket.id)
        .order('requested_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setCompletionRequest(data);
    } catch (error) {
      console.error('Error fetching completion request:', error);
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim()) return;

    setSendingComment(true);
    try {
      const { error } = await supabase
        .from('ticket_comments')
        .insert([{
          ticket_id: ticket.id,
          user_id: profile.id,
          message: newComment.trim(),
        }]);

      if (error) throw error;

      message.success('Comment added');
      setNewComment('');
      fetchComments();
    } catch (error) {
      message.error('Failed to add comment');
      console.error('Error:', error);
    } finally {
      setSendingComment(false);
    }
  };

  const handleRequestCompletion = async () => {
    setLoadingRequest(true);
    try {
      const { error } = await supabase
        .from('ticket_completion_requests')
        .insert([{
          ticket_id: ticket.id,
          requested_by: profile.id,
        }]);

      if (error) throw error;

      message.success('Completion request submitted');
      fetchCompletionRequest();
    } catch (error) {
      message.error('Failed to submit completion request');
      console.error('Error:', error);
    } finally {
      setLoadingRequest(false);
    }
  };

  const handleReviewRequest = async (approved) => {
    setReviewAction(approved ? 'approved' : 'rejected');
    setReviewModalVisible(true);
  };

  const submitReview = async () => {
    setLoadingRequest(true);
    try {
      const { error: updateRequestError } = await supabase
        .from('ticket_completion_requests')
        .update({
          status: reviewAction,
          reviewed_by: profile.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes.trim() || null,
        })
        .eq('id', completionRequest.id);

      if (updateRequestError) throw updateRequestError;

      if (reviewAction === 'approved') {
        const { error: updateTicketError } = await supabase
          .from('tickets')
          .update({ status: 'completed' })
          .eq('id', ticket.id);

        if (updateTicketError) throw updateTicketError;
      }

      message.success(`Request ${reviewAction}`);
      setReviewModalVisible(false);
      setReviewNotes('');
      setReviewAction(null);
      fetchCompletionRequest();
      if (onUpdate) onUpdate();
    } catch (error) {
      message.error('Failed to review request');
      console.error('Error:', error);
    } finally {
      setLoadingRequest(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'blue',
      in_progress: 'orange',
      completed: 'green',
      closed: 'default',
    };
    return colors[status] || 'default';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'default',
      medium: 'blue',
      high: 'orange',
      urgent: 'red',
    };
    return colors[priority] || 'default';
  };

  const isEmployee = profile?.role === 'employee';
  const isPM = profile?.role === 'project_manager';
  const canRequestCompletion = isEmployee && ticket?.assigned_to === profile?.id &&
                                ticket?.status !== 'completed' &&
                                (!completionRequest || completionRequest.status === 'rejected');
  const canReview = isPM && completionRequest?.status === 'pending';

  return (
    <>
      <Drawer
        title="Ticket Details"
        placement="right"
        width={600}
        onClose={onClose}
        open={visible}
        styles={{ body: { paddingBottom: 80 } }}
      >
        {ticket && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">{ticket.title}</h2>
              <Space size="middle" wrap>
                <Tag color={getStatusColor(ticket.status)}>
                  {ticket.status?.replace('_', ' ').toUpperCase()}
                </Tag>
                <Tag color={getPriorityColor(ticket.priority)}>
                  {ticket.priority?.toUpperCase()}
                </Tag>
              </Space>
            </div>

            {ticket.description && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Description</h3>
                <p>{ticket.description}</p>
              </div>
            )}

            {ticket.due_date && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Due Date</h3>
                <p>{ticket.due_date}</p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold mb-2">Assigned To</h3>
              <div className="flex items-center gap-2">
                <Avatar
                  src={ticket.assigned_user?.user_photo}
                  icon={<UserOutlined />}
                  size={32}
                  shape="circle"
                />
                <span>{ticket.assigned_user?.full_name || 'Unassigned'}</span>
              </div>
            </div>

            {completionRequest && (
              <Card
                size="small"
                className={`${
                  completionRequest.status === 'pending' ? 'border-orange-300 bg-orange-50' :
                  completionRequest.status === 'approved' ? 'border-green-300 bg-green-50' :
                  'border-red-300 bg-red-50'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Completion Request</span>
                    <Tag color={
                      completionRequest.status === 'pending' ? 'orange' :
                      completionRequest.status === 'approved' ? 'green' : 'red'
                    }>
                      {completionRequest.status.toUpperCase()}
                    </Tag>
                  </div>
                  <div className="text-sm text-gray-600">
                    Requested by {completionRequest.requester?.full_name} {dayjs(completionRequest.requested_at).fromNow()}
                  </div>
                  {completionRequest.status !== 'pending' && (
                    <>
                      <div className="text-sm text-gray-600">
                        Reviewed by {completionRequest.reviewer?.full_name} {dayjs(completionRequest.reviewed_at).fromNow()}
                      </div>
                      {completionRequest.review_notes && (
                        <div className="text-sm mt-2">
                          <strong>Review Notes:</strong> {completionRequest.review_notes}
                        </div>
                      )}
                    </>
                  )}
                  {canReview && (
                    <Space className="mt-2">
                      <Button
                        type="primary"
                        size="small"
                        icon={<CheckCircleOutlined />}
                        onClick={() => handleReviewRequest(true)}
                        loading={loadingRequest}
                      >
                        Approve
                      </Button>
                      <Button
                        danger
                        size="small"
                        icon={<CloseCircleOutlined />}
                        onClick={() => handleReviewRequest(false)}
                        loading={loadingRequest}
                      >
                        Reject
                      </Button>
                    </Space>
                  )}
                </div>
              </Card>
            )}

            {canRequestCompletion && (
              <Button
                type="primary"
                block
                icon={<CheckCircleOutlined />}
                onClick={handleRequestCompletion}
                loading={loadingRequest}
              >
                Request Completion
              </Button>
            )}

            <Divider />

            <div>
              <h3 className="text-sm font-semibold mb-3">Comments ({comments.length})</h3>

              <div className="mb-4">
                <TextArea
                  rows={3}
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onPressEnter={(e) => {
                    if (e.shiftKey) return;
                    e.preventDefault();
                    handleSendComment();
                  }}
                />
                <div className="flex justify-end mt-2">
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSendComment}
                    loading={sendingComment}
                    disabled={!newComment.trim()}
                  >
                    Send
                  </Button>
                </div>
              </div>

              <List
                loading={loadingComments}
                dataSource={comments}
                locale={{ emptyText: 'No comments yet' }}
                renderItem={(comment) => (
                  <List.Item key={comment.id} className="border-0 px-0">
                    <div className="w-full">
                      <div className="flex items-start gap-3">
                        <Avatar
                          src={comment.profiles?.user_photo}
                          icon={<UserOutlined />}
                          size={36}
                          shape="circle"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">
                              {comment.profiles?.full_name}
                            </span>
                            <Tag size="small" color={comment.profiles?.role === 'project_manager' ? 'blue' : 'default'}>
                              {comment.profiles?.role?.replace('_', ' ').toUpperCase()}
                            </Tag>
                            <span className="text-xs">
                              {dayjs(comment.created_at).fromNow()}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap">{comment.message}</p>
                        </div>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        title={`${reviewAction === 'approved' ? 'Approve' : 'Reject'} Completion Request`}
        open={reviewModalVisible}
        onOk={submitReview}
        onCancel={() => {
          setReviewModalVisible(false);
          setReviewNotes('');
          setReviewAction(null);
        }}
        okText={reviewAction === 'approved' ? 'Approve' : 'Reject'}
        okButtonProps={{
          danger: reviewAction === 'rejected',
          loading: loadingRequest
        }}
      >
        <div className="py-4">
          <p className="mb-4">
            {reviewAction === 'approved'
              ? 'Are you sure you want to approve this completion request? The ticket status will be updated to completed.'
              : 'Please provide a reason for rejecting this completion request.'}
          </p>
          <TextArea
            rows={4}
            placeholder={reviewAction === 'approved' ? 'Add notes (optional)...' : 'Reason for rejection...'}
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
          />
        </div>
      </Modal>
    </>
  );
};

export default TicketDetailsDrawer;
