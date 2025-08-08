import React from 'react';
import { Dashboard } from '../Dashboard';
import type { Meta, StoryObj } from '@storybook/react';

const stats = [
  { label: 'Customers', value: 42 },
  { label: 'Leads', value: 12 },
  { label: 'Tasks', value: 7 },
];

const meta: Meta<typeof Dashboard> = {
  title: 'UI/Dashboard',
  component: Dashboard,
};
export default meta;

type Story = StoryObj<typeof Dashboard>;

export const Default: Story = {
  args: {
    stats,
    loading: false,
    error: undefined,
    onQuickAction: (action) => alert(`Action: ${action}`),
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};

export const Error: Story = {
  args: {
    error: 'Failed to load dashboard',
  },
}; 