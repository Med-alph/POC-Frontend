/**
 * NotificationCenter Component Tests
 * 
 * Basic tests for NotificationCenter component.
 * 
 * Run: npm test NotificationCenter.test
 * 
 * TODO: Set up your test environment (React Testing Library, Jest, etc.)
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import NotificationCenter from './NotificationCenter';
import { useNotifications } from '../../../hooks/useNotifications';

// Mock the useNotifications hook
jest.mock('../../../hooks/useNotifications');

// Mock Redux store
const mockStore = configureStore({
  reducer: {
    auth: (state = { user: { id: 'test-user-id' } }) => state,
  },
});

describe('NotificationCenter', () => {
  const mockNotifications = [
    {
      id: '1',
      user_id: 'test-user-id',
      type: 'appointment' as const,
      title: 'Appointment Arrived',
      body: 'Patient has arrived',
      severity: 'info' as const,
      status: 'unread' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      user_id: 'test-user-id',
      type: 'lab' as const,
      title: 'Lab Result Ready',
      body: 'Lab results available',
      severity: 'critical' as const,
      status: 'unread' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const mockUseNotifications = {
    notifications: mockNotifications,
    groupedNotifications: {},
    counts: {
      total: 2,
      unread: 2,
      by_type: { appointment: 1, lab: 1, claim: 0, task: 0, inventory: 0, system: 0 },
      by_severity: { info: 1, warning: 0, critical: 1 },
    },
    loading: false,
    hasMore: false,
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    dismiss: jest.fn(),
    loadMore: jest.fn(),
    refresh: jest.fn(),
  };

  beforeEach(() => {
    (useNotifications as jest.Mock).mockReturnValue(mockUseNotifications);
  });

  it('renders notification center', () => {
    render(
      <Provider store={mockStore}>
        <NotificationCenter />
      </Provider>
    );

    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('displays notifications', () => {
    render(
      <Provider store={mockStore}>
        <NotificationCenter />
      </Provider>
    );

    expect(screen.getByText('Appointment Arrived')).toBeInTheDocument();
    expect(screen.getByText('Lab Result Ready')).toBeInTheDocument();
  });

  it('shows unread count badge', () => {
    render(
      <Provider store={mockStore}>
        <NotificationCenter />
      </Provider>
    );

    expect(screen.getByText('2')).toBeInTheDocument(); // Unread count
  });

  it('calls markAllAsRead when button clicked', () => {
    render(
      <Provider store={mockStore}>
        <NotificationCenter />
      </Provider>
    );

    const markAllButton = screen.getByText('Mark all read');
    fireEvent.click(markAllButton);

    expect(mockUseNotifications.markAllAsRead).toHaveBeenCalled();
  });

  it('filters notifications by search query', () => {
    render(
      <Provider store={mockStore}>
        <NotificationCenter />
      </Provider>
    );

    const searchInput = screen.getByPlaceholderText('Search notifications...');
    fireEvent.change(searchInput, { target: { value: 'Lab' } });

    expect(screen.getByText('Lab Result Ready')).toBeInTheDocument();
    expect(screen.queryByText('Appointment Arrived')).not.toBeInTheDocument();
  });

  it('shows empty state when no notifications', () => {
    (useNotifications as jest.Mock).mockReturnValue({
      ...mockUseNotifications,
      notifications: [],
    });

    render(
      <Provider store={mockStore}>
        <NotificationCenter />
      </Provider>
    );

    expect(screen.getByText("You're all caught up!")).toBeInTheDocument();
  });
});

