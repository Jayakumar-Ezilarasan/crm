import React from 'react';
import { LeadsPipeline } from '../LeadsPipeline';
import type { Meta, StoryObj } from '@storybook/react';
import { Lead } from '../../../types/models';

const columns = {
  Lead: [
    { id: 1, customer_id: 1, category_id: 1, stage: 'Lead', value: 10000, source: 'Referral' },
  ],
  Qualified: [
    { id: 2, customer_id: 2, category_id: 1, stage: 'Qualified', value: 5000, source: 'Website' },
  ],
  Proposal: [],
  Closed: [],
};

const meta: Meta<typeof LeadsPipeline> = {
  title: 'UI/LeadsPipeline',
  component: LeadsPipeline,
};
export default meta;

type Story = StoryObj<typeof LeadsPipeline>;

export const Default: Story = {
  args: {
    columns,
    loading: false,
    error: undefined,
    onMove: (id, stage) => alert(`Moved lead ${id} to ${stage}`),
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};

export const Error: Story = {
  args: {
    error: 'Failed to load leads',
  },
}; 