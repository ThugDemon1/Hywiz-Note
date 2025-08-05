import React, { useState, useEffect } from 'react';
import { 
  BarChart3, PieChart, TrendingUp, Calendar, Clock, FileText, ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react';
import { useNotesStore } from '../../stores/useNotesStore';
import { useNotebooksStore } from '../../stores/useNotebooksStore';
import { useTagsStore } from '../../stores/useTagsStore';

interface AnalyticsData {
  totalNotes: number;
  totalNotebooks: number;
  totalTags: number;
  notesThisWeek: number;
  notesThisMonth: number;
  notesGrowth: number;
  mostActiveDay: string;
  mostUsedTag: string;
  averageNotesPerDay: number;
  notesByNotebook: Array<{ name: string; count: number }>;
  notesByTag: Array<{ name: string; count: number; color: string }>;
  notesByDate: Array<{ date: string; count: number }>;
  recentActivity: Array<{
    id: string;
    type: 'created' | 'updated' | 'shared';
    title: string;
    timestamp: string;
  }>;
}

export const DashboardAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [isLoading, setIsLoading] = useState(true);
  
  const { notes } = useNotesStore();
  const { notebooks } = useNotebooksStore();
  const { tags } = useTagsStore();

  useEffect(() => {
    calculateAnalytics();
  }, [notes, notebooks, tags, timeRange]);

  const calculateAnalytics = () => {
    setIsLoading(true);
    
    // Calculate basic stats
    const totalNotes = notes.length;
    const totalNotebooks = notebooks.length;
    const totalTags = tags.length;

    // Calculate notes by date range
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const notesThisWeek = notes.filter(note => new Date(note.createdAt) >= weekAgo).length;
    const notesThisMonth = notes.filter(note => new Date(note.createdAt) >= monthAgo).length;

    // Calculate growth
    const previousPeriod = timeRange === '7d' ? 14 : timeRange === '30d' ? 60 : 180;
    const previousPeriodStart = new Date(now.getTime() - previousPeriod * 24 * 60 * 60 * 1000);
    const currentPeriodStart = timeRange === '7d' ? weekAgo : monthAgo;
    
    const previousPeriodNotes = notes.filter(note => {
      const date = new Date(note.createdAt);
      return date >= previousPeriodStart && date < currentPeriodStart;
    }).length;
    
    const currentPeriodNotes = timeRange === '7d' ? notesThisWeek : notesThisMonth;
    const notesGrowth = previousPeriodNotes > 0 
      ? ((currentPeriodNotes - previousPeriodNotes) / previousPeriodNotes) * 100 
      : 0;

    // Calculate notes by notebook - fix notebookId access
    const notesByNotebook = notebooks.map(notebook => ({
      name: notebook.name,
      count: notes.filter(note => note.primaryNotebookId?._id === notebook._id).length
    })).sort((a, b) => b.count - a.count).slice(0, 5);

    // Calculate notes by tag - fix tags access
    const notesByTag = tags.map(tag => ({
      name: tag.name,
      count: notes.filter(note => note.tags?.some(t => t._id === tag._id)).length,
      color: tag.color
    })).sort((a, b) => b.count - a.count).slice(0, 5);

    // Calculate notes by date for chart
    const notesByDate = [];
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const count = notes.filter(note => 
        new Date(note.createdAt).toISOString().split('T')[0] === dateStr
      ).length;
      notesByDate.push({ date: dateStr, count });
    }

    // Calculate most active day
    const dayCounts = [0, 0, 0, 0, 0, 0, 0]; // Sunday to Saturday
    notes.forEach(note => {
      const day = new Date(note.createdAt).getDay();
      dayCounts[day]++;
    });
    const mostActiveDayIndex = dayCounts.indexOf(Math.max(...dayCounts));
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const mostActiveDay = daysOfWeek[mostActiveDayIndex];

    // Calculate most used tag
    const mostUsedTag = notesByTag.length > 0 ? notesByTag[0].name : 'None';

    // Calculate average notes per day
    const averageNotesPerDay = totalNotes > 0 ? (totalNotes / 30).toFixed(1) : '0';

    // Generate recent activity
    const recentActivity = notes
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
      .map(note => ({
        id: note._id,
        type: 'updated' as const,
        title: note.title,
        timestamp: new Date(note.updatedAt).toLocaleDateString()
      }));

    setAnalyticsData({
      totalNotes,
      totalNotebooks,
      totalTags,
      notesThisWeek,
      notesThisMonth,
      notesGrowth,
      mostActiveDay,
      mostUsedTag,
      averageNotesPerDay: parseFloat(averageNotesPerDay),
      notesByNotebook,
      notesByTag,
      notesByDate,
      recentActivity
    });

    setIsLoading(false);
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ComponentType<any>;
    change?: number;
    changeLabel?: string;
  }> = ({ title, value, icon: Icon, change, changeLabel }) => (
    <div className="bg-[#181818] dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {change !== undefined && (
            <div className="flex items-center mt-2">
              {change >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ml-1 ${
                change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {Math.abs(change).toFixed(1)}%
              </span>
              {changeLabel && (
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
          <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
    </div>
  );

  const ChartCard: React.FC<{
    title: string;
    children: React.ReactNode;
  }> = ({ title, children }) => (
    <div className="bg-[#181818] dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      {children}
    </div>
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#181818] dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!analyticsData) return null;

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h2>
        <div className="flex space-x-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Notes"
          value={analyticsData.totalNotes}
          icon={FileText}
          change={analyticsData.notesGrowth}
          changeLabel="vs last period"
        />
        <StatCard
          title="Notebooks"
          value={analyticsData.totalNotebooks}
          icon={BarChart3}
        />
        <StatCard
          title="Tags"
          value={analyticsData.totalTags}
          icon={PieChart}
        />
        <StatCard
          title="Avg Notes/Day"
          value={analyticsData.averageNotesPerDay}
          icon={TrendingUp}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notes Over Time */}
        <ChartCard title="Notes Created Over Time">
          <div className="h-64 flex items-end justify-between space-x-1">
            {analyticsData.notesByDate.map((item, index) => {
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-500 rounded-t"
                    style={{
                      height: `${Math.max((item.count / (analyticsData.notesByDate.length > 0 ? Math.max(...analyticsData.notesByDate.map(d => d.count)) : 1)) * 200, 4)}px`
                    }}
                  ></div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              );
            })}
          </div>
        </ChartCard>

        {/* Notes by Notebook */}
        <ChartCard title="Notes by Notebook">
          <div className="space-y-3">
            {analyticsData.notesByNotebook.map((notebook, index) => {
              return (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{notebook.name}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${(notebook.count / (analyticsData.notesByNotebook.length > 0 ? Math.max(...analyticsData.notesByNotebook.map(n => n.count)) : 1)) * 100}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white w-8 text-right">
                      {notebook.count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notes by Tag */}
        <ChartCard title="Notes by Tag">
          <div className="space-y-3">
            {analyticsData.notesByTag.map((tag, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  ></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{tag.name}</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {tag.count}
                </span>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Insights */}
        <ChartCard title="Insights">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Most Active Day</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{analyticsData.mostActiveDay}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Activity className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Most Used Tag</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{analyticsData.mostUsedTag}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Notes This Week</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{analyticsData.notesThisWeek}</p>
              </div>
            </div>
          </div>
        </ChartCard>

        {/* Recent Activity */}
        <ChartCard title="Recent Activity">
          <div className="space-y-3">
            {analyticsData.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {activity.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {activity.type} • {activity.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}; 