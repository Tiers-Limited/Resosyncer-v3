import { useState, useEffect } from 'react';
import { Card, Avatar, Empty, Spin } from 'antd';
import { UserOutlined, GiftOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const BirthdayWidget = () => {
  const [birthdays, setBirthdays] = useState([]);
  const [todayBirthday, setTodayBirthday] = useState(null);
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    fetchBirthdays();
  }, []);

  const fetchBirthdays = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, user_photo, dob')
        .not('dob', 'is', null)
        .order('full_name');

      if (error) throw error;

      const today = dayjs();
      const currentMonth = today.month();
      const currentDay = today.date();

      const monthBirthdays = (data || [])
        .filter(person => {
          if (!person.dob) return false;
          const birthday = dayjs(person.dob);
          return birthday.month() === currentMonth;
        })
        .map(person => {
          const birthday = dayjs(person.dob);
          return {
            ...person,
            day: birthday.date(),
            isToday: birthday.date() === currentDay && birthday.month() === currentMonth,
          };
        })
        .sort((a, b) => a.day - b.day);

      const todayBday = monthBirthdays.find(b => b.isToday);

      setBirthdays(monthBirthdays);
      setTodayBirthday(todayBday);
    } catch (error) {
      console.error('Error fetching birthdays:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card title={<span><GiftOutlined className="mr-2" />Birthdays This Month</span>}>
        <div className="flex justify-center py-8">
          <Spin />
        </div>
      </Card>
    );
  }

  const isMyBirthday = todayBirthday && profile && todayBirthday.id === profile.id;

  return (
    <Card title={<span><GiftOutlined className="mr-2" />Birthdays This Month</span>}>
      {isMyBirthday && (
        <div className="mb-4 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
          <div className="text-center">
            <div className="text-2xl mb-2">🎉 🎂 🎈</div>
            <div className="flex items-center justify-center gap-3 mb-2">
              <Avatar
                size={48}
                src={profile.user_photo}
                icon={<UserOutlined />}
              />
              <div className="text-left">
                <div className="font-semibold text-lg">{profile.full_name}</div>
                <div className="text-sm text-gray-600">Happy Birthday! 🎉</div>
              </div>
            </div>
            <div className="text-sm text-purple-600 font-medium mt-2">
              Wishing you a wonderful day filled with joy and happiness!
            </div>
          </div>
        </div>
      )}

      {birthdays.length > 0 ? (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {birthdays.map((person) => (
            <div
              key={person.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                person.isToday
                  ? 'bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200'
                  : ''
              }`}
            >
              <Avatar
                src={person.user_photo}
                icon={<UserOutlined />}
                size={40}
              />
              <div className="flex-1">
                <div className="font-medium flex items-center gap-2">
                  {person.full_name}
                  {person.isToday && (
                    <span className="text-xl">🎂</span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {dayjs(person.dob).format('MMMM D')}
                </div>
              </div>
              {person.isToday && (
                <GiftOutlined className="text-pink-500 text-xl" />
              )}
            </div>
          ))}
        </div>
      ) : (
        <Empty
          description="No birthdays this month"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
    </Card>
  );
};

export default BirthdayWidget;
