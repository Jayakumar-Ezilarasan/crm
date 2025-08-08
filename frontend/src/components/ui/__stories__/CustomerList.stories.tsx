import React from 'react';
import { CustomerList } from '../CustomerList';
import { Customer } from '../../../types/models';
import type { Meta, StoryObj } from '@storybook/react';

const customers: Customer[] = [
  { id: 1, name: 'Acme Corp', email: 'acme@example.com', owner_id: 1 },
  { id: 2, name: 'Beta LLC', email: 'beta@example.com', owner_id: 2 },
];

const meta: Meta<typeof CustomerList> = {
  title: 'UI/CustomerList',
  component: CustomerList,
};
export default meta;

type Story = StoryObj<typeof CustomerList>;

export const Default: Story = {
  args: {
    customers,
    loading: false,
    error: undefined,
    onSelect: (c) => alert(`Selected: ${c.name}`),
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};

export const Error: Story = {
  args: {
    error: 'Failed to load customers',
  },
}; 