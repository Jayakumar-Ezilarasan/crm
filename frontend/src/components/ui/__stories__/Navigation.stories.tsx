import React from 'react';
import { Navigation } from '../Navigation';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Navigation> = {
  title: 'UI/Navigation',
  component: Navigation,
};
export default meta;

type Story = StoryObj<typeof Navigation>;

export const User: Story = {
  args: {
    role: 'user',
    currentPath: '/customers',
    onNavigate: (path) => alert(`Navigate to ${path}`),
  },
};

export const Manager: Story = {
  args: {
    role: 'manager',
    currentPath: '/reports',
    onNavigate: (path) => alert(`Navigate to ${path}`),
  },
};

export const Admin: Story = {
  args: {
    role: 'admin',
    currentPath: '/admin',
    onNavigate: (path) => alert(`Navigate to ${path}`),
  },
}; 