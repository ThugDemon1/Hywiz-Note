import React, { useEffect, useState } from 'react';
import { FileText, Book, Tag, Bell } from 'lucide-react';
import api from '../../lib/api';

interface Stats {
  totalNotes: number;
  totalNotebooks: number;
  totalTags: number;

}

export const QuickStats: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalNotes: 0,
    totalNotebooks: 0,
    totalTags: 0,

  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/users/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, []);

  const statItems = [
    { label: 'Notes', value: stats.totalNotes, icon: FileText, color: 'text-blue-600' },
    { label: 'Notebooks', value: stats.totalNotebooks, icon: Book, color: 'text-green-600' },
    { label: 'Tags', value: stats.totalTags, icon: Tag, color: 'text-purple-600' },

  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {statItems.map((item) => {
        const IconComponent = item.icon;
        return (
          <div key={item.label} className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{item.label}</p>
                <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
              </div>
              <IconComponent className={`w-8 h-8 ${item.color}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
};