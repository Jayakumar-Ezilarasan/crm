import React from 'react';
import { InteractionHistory } from '../InteractionHistory';
import type { Meta, StoryObj } from '@storybook/react';
import { Interaction } from '../../../types/models';

const interactions: Interaction[] = [
  { id: 1, customer_id: 1, user_id: 1, type: 'call', summary: 'Called customer', interaction_date: new Date().toISOString() },
  { id: 2, customer_id: 1, user_id: 2, type: 'email', summary: 'Sent proposal', interaction_date: new Date().toISOString() },
];

const meta: Meta<typeof InteractionHistory> = {
  title: 'UI/InteractionHistory',
  component: InteractionHistory,
};
export default meta;

type Story = StoryObj<typeof InteractionHistory>;

export const Default: Story = {
  args: {
    interactions,
    loading: false,
    error: undefined,
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};

export const Error: Story = {
  args: {
    error: 'Failed to load interactions',
  },
}; 