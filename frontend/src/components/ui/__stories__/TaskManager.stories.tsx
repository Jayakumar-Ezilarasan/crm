import React from 'react';
import { TaskManager } from '../TaskManager';
import type { Meta, StoryObj } from '@storybook/react';
import { Task } from '../../../types/models';

const today = new Date();
const tasks: Task[] = [
  { id: 1, user_id: 1, customer_id: 1, title: 'Call Acme', due_date: today.toISOString(), completed: false },
  { id: 2, user_id: 2, customer_id: 2, title: 'Send contract', due_date: today.toISOString(), completed: false },
];

const meta: Meta<typeof TaskManager> = {
  title: 'UI/TaskManager',
  component: TaskManager,
};
export default meta;

type Story = StoryObj<typeof TaskManager>;

export const Default: Story = {
  args: {
    tasks,
    loading: false,
    error: undefined,
    onTaskClick: (task) => alert(`Clicked: ${task.title}`),
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};

export const Error: Story = {
  args: {
    error: 'Failed to load tasks',
  },
}; 