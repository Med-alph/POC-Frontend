/**
 * NotificationCenter Component
 * 
 * Main notification center UI with:
 * - Tabs/filters (All / Unread / Clinical / Billing / Tasks)
 * - Grouping by date or groupedKey
 * - Mark all read button
 * - Search and pagination
 * - Real-time updates via socket
 * 
 * Usage:
 *   <NotificationCenter />
 */

import { useState } from 'react';
import { Bell, Check, CheckCheck, X, Search, Filter, Loader2 } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { Notification } from '../../api/notifications';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

type FilterType = 'all' | 'unread' | 'appointment' | 'lab' | 'claim' | 'task' | 'inventory' | 'system';

export default function NotificationCenter() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<Notification['type'] | undefined>(undefined);

  const {
    notifications,
    groupedNotifications,
    counts,
    loading,
    hasMore,
    markAsRead,
    markAllAsRead,
    dismiss,
    dismissAll,
    loadMore,
    refresh,
  } = useNotifications({
    filter: activeFilter === 'unread' ? 'unread' : 'all',
    type: selectedType,
  });

  // Filter notifications by search query
  const filteredNotifications = notifications.filter((notif) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      notif.title.toLowerCase().includes(query) ||
      notif.body.toLowerCase().includes(query)
    );
  });

  // Group filtered notifications by date
  const filteredGrouped = filteredNotifications.reduce((groups, notification) => {
    const date = new Date(notification.created_at).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(notification);
    return groups;
  }, {} as Record<string, Notification[]>);

  const getSeverityColor = (severity: Notification['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
    }
  };

  const getTypeIcon = (type: Notification['type']) => {
    // TODO: Add appropriate icons for each type
    return <Bell className="h-4 w-4" />;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    }
    return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (notification.status === 'unread') {
      await markAsRead(notification.id);
    }

    // Navigate to target entity if available
    if (notification.target_type && notification.target_id) {
      // TODO: Implement navigation based on target_type
      // Example:
      // if (notification.target_type === 'appointment') {
      //   navigate(`/appointments/${notification.target_id}`);
      // } else if (notification.target_type === 'labResult') {
      //   navigate(`/labs/${notification.target_id}`);
      // }
      console.log(`Navigate to ${notification.target_type}:${notification.target_id}`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notifications
            </h2>
            {counts && counts.unread > 0 && (
              <Badge className="bg-blue-600 text-white">{counts.unread}</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {counts && counts.unread > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="flex items-center gap-1"
              >
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={dismissAll}
                className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <X className="h-4 w-4" />
                Clear all
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={refresh}>
              Refresh
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="all" onClick={() => setActiveFilter('all')}>
            All
          </TabsTrigger>
          <TabsTrigger value="unread" onClick={() => setActiveFilter('unread')}>
            Unread {counts && counts.unread > 0 && `(${counts.unread})`}
          </TabsTrigger>
          <TabsTrigger value="appointment" onClick={() => { setActiveFilter('appointment'); setSelectedType('appointment'); }}>
            Appointments
          </TabsTrigger>
          <TabsTrigger value="lab" onClick={() => { setActiveFilter('lab'); setSelectedType('lab'); }}>
            Labs
          </TabsTrigger>
          <TabsTrigger value="claim" onClick={() => { setActiveFilter('claim'); setSelectedType('claim'); }}>
            Claims
          </TabsTrigger>
          <TabsTrigger value="task" onClick={() => { setActiveFilter('task'); setSelectedType('task'); }}>
            Tasks
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeFilter} className="flex-1 overflow-y-auto p-4">
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Bell className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                No notifications
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {searchQuery ? 'No notifications match your search.' : 'You're all caught up!'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(filteredGrouped).map(([date, dateNotifications]) => (
                <div key={date} className="space-y-2">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {date}
                  </h3>
                  {dateNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                        notification.status === 'unread'
                          ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getTypeIcon(notification.type)}
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                              {notification.title}
                            </h4>
                            <Badge className={getSeverityColor(notification.severity)}>
                              {notification.severity}
                            </Badge>
                            {notification.status === 'unread' && (
                              <div className="h-2 w-2 rounded-full bg-blue-600" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {notification.body}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {formatDate(notification.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {notification.status === 'unread' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              dismiss(notification.id);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              {/* Load More */}
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <Button variant="outline" onClick={loadMore} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

