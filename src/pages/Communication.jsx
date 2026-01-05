import { useState, useEffect, useRef } from "react";
import {
  Layout,
  Input,
  Button,
  Avatar,
  message,
  Modal,
  Form,
  Select,
  Upload,
  Tooltip,
  notification,
  Dropdown,
  Tag,
  Badge,
} from "antd";
import {
  SendOutlined,
  UserOutlined,
  PlusOutlined,
  FileOutlined,
  AudioOutlined,
  StopOutlined,
  MessageOutlined,
  SettingOutlined,
  TeamOutlined,
  DeleteOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

const { Sider, Content } = Layout;
const { TextArea } = Input;

const Communication = () => {
  const [users, setUsers] = useState([]);
  const [channels, setChannels] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [channelModal, setChannelModal] = useState(false);
  const [membersModal, setMembersModal] = useState(false);
  const [addMemberModal, setAddMemberModal] = useState(false);
  const [channelMembers, setChannelMembers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [form] = Form.useForm();
  const [addMemberForm] = Form.useForm();
  const { profile } = useAuth();
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    fetchUsers();
    fetchChannels();
    subscribeToMessages();
    fetchUnreadCounts();

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (selectedUser || selectedChannel) {
      fetchMessages();
      markMessagesAsRead();
    }
  }, [selectedUser, selectedChannel]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, user_photo")
        .neq("id", profile.id)
        .eq("suspended", false)
        .order("full_name");

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchChannels = async () => {
    try {
      const { data, error } = await supabase
        .from("channels")
        .select("*")
        .order("name");

      if (error) throw error;
      setChannels(data || []);
    } catch (error) {
      console.error("Error fetching channels:", error);
    }
  };

  const fetchUnreadCounts = async () => {
    try {
      const { data: directMessages, error: dmError } = await supabase
        .from("messages")
        .select("sender_id")
        .eq("receiver_id", profile.id)
        .is("channel_id", null)
        .eq("is_read", false);

      if (dmError) throw dmError;

      const dmCounts = {};
      directMessages?.forEach((msg) => {
        dmCounts[msg.sender_id] = (dmCounts[msg.sender_id] || 0) + 1;
      });

      const { data: channelMessages, error: channelError } = await supabase
        .from("messages")
        .select("id, channel_id")
        .not("channel_id", "is", null)
        .neq("sender_id", profile.id);

      if (channelError) throw channelError;

      const messageIds = channelMessages?.map((m) => m.id) || [];

      const { data: readStatus, error: readError } = await supabase
        .from("message_read_status")
        .select("message_id")
        .eq("user_id", profile.id)
        .in("message_id", messageIds.length > 0 ? messageIds : [""]);

      if (readError) throw readError;

      const readMessageIds = new Set(
        readStatus?.map((r) => r.message_id) || []
      );
      const channelCounts = {};

      channelMessages?.forEach((msg) => {
        if (!readMessageIds.has(msg.id)) {
          channelCounts[msg.channel_id] =
            (channelCounts[msg.channel_id] || 0) + 1;
        }
      });

      setUnreadCounts({ ...dmCounts, ...channelCounts });
    } catch (error) {
      console.error("Error fetching unread counts:", error);
    }
  };

  const fetchMessages = async () => {
    try {
      let query = supabase
        .from("messages")
        .select(
          `
          *,
          sender:profiles!messages_sender_id_fkey(id, full_name, user_photo)
        `
        )
        .order("created_at", { ascending: true });

      if (selectedChannel) {
        query = query.eq("channel_id", selectedChannel.id);
      } else if (selectedUser) {
        query = query.or(
          `and(sender_id.eq.${profile.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${profile.id})`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      setMessages(data || []);

      markMessagesAsRead();
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      if (selectedUser) {
        await supabase
          .from("messages")
          .update({ is_read: true })
          .eq("sender_id", selectedUser.id)
          .eq("receiver_id", profile.id)
          .eq("is_read", false);
      } else if (selectedChannel) {
        const { data: unreadMessages } = await supabase
          .from("messages")
          .select("id")
          .eq("channel_id", selectedChannel.id)
          .neq("sender_id", profile.id);

        if (unreadMessages && unreadMessages.length > 0) {
          const readStatusRecords = unreadMessages.map((msg) => ({
            message_id: msg.id,
            user_id: profile.id,
          }));

          await supabase.from("message_read_status").upsert(readStatusRecords, {
            onConflict: "message_id,user_id",
            ignoreDuplicates: true,
          });
        }
      }
      fetchUnreadCounts();
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const subscribeToMessages = () => {
    const subscription = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const newMsg = payload.new;

          const isInCurrentConversation =
            (selectedChannel && newMsg.channel_id === selectedChannel.id) ||
            (selectedUser &&
              ((newMsg.sender_id === selectedUser.id &&
                newMsg.receiver_id === profile.id) ||
                (newMsg.sender_id === profile.id &&
                  newMsg.receiver_id === selectedUser.id)));

          if (isInCurrentConversation) {
            fetchMessages();
          }

          fetchUnreadCounts();

          if (
            newMsg.receiver_id === profile.id &&
            newMsg.sender_id !== profile.id
          ) {
            const { data: senderData } = await supabase
              .from("profiles")
              .select("full_name, user_photo")
              .eq("id", newMsg.sender_id)
              .single();

            if (senderData) {
              const messagePreview = newMsg.message
                ? newMsg.message.length > 50
                  ? newMsg.message.substring(0, 50) + "..."
                  : newMsg.message
                : newMsg.file_type === "voice"
                ? "🎤 Voice message"
                : newMsg.file_type
                ? "📎 Attachment"
                : "New message";

              notification.open({
                message: senderData.full_name,
                description: messagePreview,
                icon: (
                  <Avatar
                    src={senderData.user_photo}
                    icon={<UserOutlined />}
                    style={{ backgroundColor: "#001529" }}
                  />
                ),
                placement: "topRight",
                duration: 4,
                style: {
                  cursor: "pointer",
                },
                onClick: () => {
                  const sender = users.find((u) => u.id === newMsg.sender_id);
                  if (sender) {
                    setSelectedUser(sender);
                    setSelectedChannel(null);
                  }
                  notification.destroy();
                },
              });

              if (
                "Notification" in window &&
                Notification.permission === "granted"
              ) {
                new Notification(senderData.full_name, {
                  body: messagePreview,
                  icon: senderData.user_photo || "/favicon.ico",
                });
              }
            }
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        () => {
          fetchUnreadCounts();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !audioURL) return;

    setLoading(true);
    try {
      let fileUrl = null;
      let fileType = null;
      let fileName = null;

      if (audioURL) {
        const response = await fetch(audioURL);
        const blob = await response.blob();
        const file = new File([blob], `voice-${Date.now()}.webm`, {
          type: "audio/webm",
        });

        const filePath = `${profile.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("chat-files")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("chat-files")
          .getPublicUrl(filePath);

        fileUrl = urlData.publicUrl;
        fileType = "voice";
        fileName = file.name;
      }

      const messageData = {
        sender_id: profile.id,
        message: newMessage.trim() || null,
        file_url: fileUrl,
        file_type: fileType,
        file_name: fileName,
      };

      if (selectedChannel) {
        messageData.channel_id = selectedChannel.id;
      } else if (selectedUser) {
        messageData.receiver_id = selectedUser.id;
      }

      const { error } = await supabase.from("messages").insert([messageData]);

      if (error) throw error;

      setNewMessage("");
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
        setAudioURL(null);
      }
      audioChunksRef.current = [];
      fetchMessages();
    } catch (error) {
      message.error("Failed to send message");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    setLoading(true);
    try {
      const filePath = `${profile.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("chat-files")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("chat-files")
        .getPublicUrl(filePath);

      const fileType = file.type.startsWith("image/") ? "image" : "document";

      const messageData = {
        sender_id: profile.id,
        message: null,
        file_url: urlData.publicUrl,
        file_type: fileType,
        file_name: file.name,
      };

      if (selectedChannel) {
        messageData.channel_id = selectedChannel.id;
      } else if (selectedUser) {
        messageData.receiver_id = selectedUser.id;
      }

      const { error } = await supabase.from("messages").insert([messageData]);

      if (error) throw error;

      message.success("File sent successfully");
      fetchMessages();
    } catch (error) {
      message.error("Failed to upload file");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
    return false;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (error) {
      message.error("Failed to start recording");
      console.error("Error:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleCreateChannel = async (values) => {
    setLoading(true);
    try {
      const { data: channelData, error: channelError } = await supabase
        .from("channels")
        .insert([
          {
            name: values.name,
            description: values.description,
            created_by: profile.id,
          },
        ])
        .select()
        .single();

      if (channelError) throw channelError;

      await supabase
        .from("channel_members")
        .insert([{ channel_id: channelData.id, user_id: profile.id }]);

      if (values.members && values.members.length > 0) {
        const memberInserts = values.members.map((userId) => ({
          channel_id: channelData.id,
          user_id: userId,
        }));

        await supabase.from("channel_members").insert(memberInserts);
      }

      message.success("Channel created successfully");
      setChannelModal(false);
      form.resetFields();
      fetchChannels();
    } catch (error) {
      message.error("Failed to create channel");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinChannel = async (channelId) => {
    try {
      const { error } = await supabase
        .from("channel_members")
        .insert([{ channel_id: channelId, user_id: profile.id }]);

      if (error) {
        if (error.code !== "23505") {
          throw error;
        }
      }
    } catch (error) {
      console.error("Error joining channel:", error);
    }
  };

  const fetchChannelMembers = async (channelId) => {
    try {
      const { data, error } = await supabase
        .from("channel_members")
        .select(
          `
          id,
          user_id,
          joined_at,
          profiles:user_id (
            id,
            full_name,
            email,
            user_photo,
            role
          )
        `
        )
        .eq("channel_id", channelId);

      if (error) throw error;
      setChannelMembers(data || []);
    } catch (error) {
      console.error("Error fetching channel members:", error);
      message.error("Failed to fetch channel members");
    }
  };

  const fetchAvailableUsers = async (channelId) => {
    try {
      const { data: members, error: membersError } = await supabase
        .from("channel_members")
        .select("user_id")
        .eq("channel_id", channelId);

      if (membersError) throw membersError;

      const memberIds = members.map((m) => m.user_id);

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, user_photo, role")
        .not("id", "in", `(${memberIds.join(",")})`)
        .eq("suspended", false)
        .order("full_name");

      if (error) throw error;
      setAvailableUsers(data || []);
    } catch (error) {
      console.error("Error fetching available users:", error);
    }
  };

  const handleViewMembers = (channel) => {
    setSelectedChannel(channel);
    fetchChannelMembers(channel.id);
    setMembersModal(true);
  };

  const handleAddMember = async (values) => {
    try {
      const { error } = await supabase.from("channel_members").insert([
        {
          channel_id: selectedChannel.id,
          user_id: values.userId,
        },
      ]);

      if (error) throw error;

      message.success("Member added successfully");
      setAddMemberModal(false);
      addMemberForm.resetFields();
      fetchChannelMembers(selectedChannel.id);
      fetchAvailableUsers(selectedChannel.id);
    } catch (error) {
      message.error("Failed to add member");
      console.error("Error:", error);
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    Modal.confirm({
      title: "Remove Member",
      content: `Are you sure you want to remove ${memberName} from this channel?`,
      okText: "Remove",
      okType: "danger",
      onOk: async () => {
        try {
          const { error } = await supabase
            .from("channel_members")
            .delete()
            .eq("id", memberId);

          if (error) throw error;

          message.success("Member removed successfully");
          fetchChannelMembers(selectedChannel.id);
        } catch (error) {
          message.error("Failed to remove member");
          console.error("Error:", error);
        }
      },
    });
  };

  const renderMessage = (msg) => {
    const isOwn = msg.sender_id === profile.id;

    return (
      <div
        key={msg.id}
        className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-6`}
      >
        <div
          className={`flex ${
            isOwn ? "flex-row-reverse" : "flex-row"
          } items-start gap-3 max-w-[75%]`}
        >
          <Avatar
            src={isOwn ? profile.user_photo : msg.sender?.user_photo}
            icon={<UserOutlined />}
            size={40}
            style={{ backgroundColor: "#001529", flexShrink: 0 }}
          />
          <div className="flex-1">
            <div
              className={`flex items-baseline gap-2 mb-1 ${
                isOwn ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <span className="font-semibold text-sm text-gray-800">
                {isOwn ? profile.full_name || "You" : msg.sender?.full_name}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(msg.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div
              className={`rounded-2xl px-4 py-3 shadow-sm ${
                isOwn
                  ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                  : "bg-white border border-gray-200"
              }`}
            >
              {msg.file_type === "image" && (
                <img
                  src={msg.file_url}
                  alt="attachment"
                  className="max-w-full rounded-lg mb-2"
                  style={{ maxWidth: "300px" }}
                />
              )}
              {msg.file_type === "voice" && (
                <div className="mb-2 w-full min-w-[300px]">
                  <audio
                    controls
                    className="w-full h-12"
                    style={{
                      borderRadius: "8px",
                      backgroundColor: "rgba(0,0,0,0.05)",
                      minHeight: "48px",
                    }}
                  >
                    <source src={msg.file_url} type="audio/webm" />
                  </audio>
                </div>
              )}
              {msg.file_type === "document" && (
                <a
                  href={msg.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 mb-2 hover:underline ${
                    isOwn ? "text-white" : "text-blue-600"
                  }`}
                >
                  <FileOutlined />
                  <span>{msg.file_name}</span>
                </a>
              )}
              {msg.message && (
                <div className="whitespace-pre-wrap break-words">
                  {msg.message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout className="h-[calc(100vh-64px)]">
      <Sider width={280} theme="light" className="border-r">
        <div className="p-4">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setChannelModal(true)}
            block
            style={{ backgroundColor: "#001529", marginBottom: 16 }}
          >
            Create Channel
          </Button>

          <div className="flex flex-col h-full">
            {/* Channels */}
            <div className="mb-4 flex flex-col">
              <h3 className="font-semibold text-gray-700 mb-2"># Channels</h3>

              <div className="space-y-1 overflow-y-auto max-h-60 pr-1">
                {channels.map((channel) => {
                  const unreadCount = unreadCounts[channel.id] || 0;

                  return (
                    <div
                      key={channel.id}
                      className={`cursor-pointer hover:bg-gray-100 px-2 py-2 rounded flex items-center justify-between ${
                        selectedChannel?.id === channel.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <div
                        className="flex-1 flex items-center justify-between"
                        onClick={() => {
                          setSelectedChannel(channel);
                          setSelectedUser(null);
                          handleJoinChannel(channel.id);
                        }}
                      >
                        <span className="text-sm"># {channel.name}</span>
                        {unreadCount > 0 && (
                          <Badge count={unreadCount} size="small" />
                        )}
                      </div>

                      {profile?.role === "admin" && (
                        <Button
                          type="text"
                          size="small"
                          icon={<SettingOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewMembers(channel);
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Direct Messages */}
            <div className="flex flex-col">
              <h3 className="font-semibold text-gray-700 mb-2">
                Direct Messages
              </h3>

              <div className="space-y-1 overflow-y-auto max-h-[500px] pr-1">
                {users.map((user) => {
                  const unreadCount = unreadCounts[user.id] || 0;

                  return (
                    <div
                      key={user.id}
                      className={`cursor-pointer hover:bg-gray-100 px-2 py-2 rounded flex items-center gap-2 ${
                        selectedUser?.id === user.id ? "bg-blue-50" : ""
                      }`}
                      onClick={() => {
                        setSelectedUser(user);
                        setSelectedChannel(null);
                      }}
                    >
                      <Avatar
                        src={user.user_photo}
                        icon={<UserOutlined />}
                        size="small"
                      />
                      <div className="flex-1 flex items-center justify-between">
                        <span className="text-sm">{user.full_name}</span>
                        {unreadCount > 0 && (
                          <Badge count={unreadCount} size="small" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </Sider>

      <Content className="flex flex-col">
        {selectedUser || selectedChannel ? (
          <>
            <div className="p-4 border-b bg-white shadow-sm">
              <div className="flex items-center gap-3">
                {selectedUser && (
                  <Avatar
                    src={selectedUser.user_photo}
                    icon={<UserOutlined />}
                    size={48}
                    style={{ backgroundColor: "#001529" }}
                  />
                )}
                <div>
                  <h2 className="text-lg font-semibold">
                    {selectedChannel
                      ? `# ${selectedChannel.name}`
                      : selectedUser?.full_name}
                  </h2>
                  {selectedChannel ? (
                    <p className="text-sm text-gray-500">
                      {selectedChannel.description}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">
                      {selectedUser?.email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-white">
              {messages.map(renderMessage)}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t bg-white shadow-lg">
              {audioURL && (
                <div className="mb-2 flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <audio
                    controls
                    src={audioURL}
                    className="flex-1 h-12"
                    style={{
                      borderRadius: "8px",
                      minHeight: "48px",
                    }}
                  />
                  <Button
                    size="small"
                    onClick={() => {
                      URL.revokeObjectURL(audioURL);
                      setAudioURL(null);
                      audioChunksRef.current = [];
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
              <div className="flex gap-2">
                <TextArea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  onPressEnter={(e) => {
                    if (!e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <div className="flex gap-1">
                  <Upload
                    beforeUpload={handleFileUpload}
                    showUploadList={false}
                  >
                    <Tooltip title="Attach file">
                      <Button icon={<FileOutlined />} />
                    </Tooltip>
                  </Upload>
                  <Tooltip
                    title={
                      recording ? "Stop recording" : "Record voice message"
                    }
                  >
                    <Button
                      icon={recording ? <StopOutlined /> : <AudioOutlined />}
                      onClick={recording ? stopRecording : startRecording}
                      danger={recording}
                    />
                  </Tooltip>
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSendMessage}
                    loading={loading}
                    style={{ backgroundColor: "#001529" }}
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <MessageOutlined style={{ fontSize: 64, marginBottom: 16 }} />
              <p>Select a channel or user to start chatting</p>
            </div>
          </div>
        )}
      </Content>

      <Modal
        title="Create Channel"
        open={channelModal}
        onCancel={() => {
          setChannelModal(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateChannel}>
          <Form.Item
            name="name"
            label="Channel Name"
            rules={[{ required: true, message: "Please enter channel name" }]}
          >
            <Input placeholder="general" prefix="#" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Channel description" />
          </Form.Item>

          <Form.Item name="members" label="Add Members">
            <Select
              mode="multiple"
              placeholder="Select members"
              options={users.map((user) => ({
                label: user.full_name,
                value: user.id,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <div className="flex items-center justify-between">
            <span>
              <TeamOutlined className="mr-2" />
              Channel Members - {selectedChannel?.name}
            </span>
          </div>
        }
        open={membersModal}
        onCancel={() => {
          setMembersModal(false);
          setChannelMembers([]);
        }}
        footer={null}
        width={600}
      >
        <div className="mb-4">
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() => {
              fetchAvailableUsers(selectedChannel.id);
              setAddMemberModal(true);
            }}
            style={{ backgroundColor: "#001529" }}
          >
            Add Member
          </Button>
        </div>

        <div className="space-y-3">
          {channelMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 border rounded hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <Avatar
                  src={member.profiles?.user_photo}
                  icon={<UserOutlined />}
                  size={40}
                  style={{ backgroundColor: "#001529" }}
                />
                <div>
                  <div className="font-medium">
                    {member.profiles?.full_name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {member.profiles?.email}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Tag color="blue">{member.profiles?.role}</Tag>
                    <span className="text-xs text-gray-400">
                      Joined {new Date(member.joined_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              {profile?.role === "admin" && member.user_id !== profile.id && (
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() =>
                    handleRemoveMember(member.id, member.profiles?.full_name)
                  }
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        title="Add Member to Channel"
        open={addMemberModal}
        onCancel={() => {
          setAddMemberModal(false);
          addMemberForm.resetFields();
        }}
        onOk={() => addMemberForm.submit()}
      >
        <Form form={addMemberForm} layout="vertical" onFinish={handleAddMember}>
          <Form.Item
            name="userId"
            label="Select User"
            rules={[{ required: true, message: "Please select a user" }]}
          >
            <Select
              placeholder="Choose a user to add"
              showSearch
              filterOption={(input, option) =>
                option.label.toLowerCase().includes(input.toLowerCase())
              }
              options={availableUsers.map((user) => ({
                label: `${user.full_name} (${user.email})`,
                value: user.id,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default Communication;
