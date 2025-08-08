import React from 'react';
import { DataTable } from '../DataTable';
import type { Meta, StoryObj } from '@storybook/react';
import { Customer } from '../../../types/models';

const columns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
];

const data: Customer[] = [
  { id: 1, name: 'Acme Corp', email: 'acme@example.com', owner_id: 1 },
  { id: 2, name: 'Beta LLC', email: 'beta@example.com', owner_id: 2 },
];

const meta: Meta<typeof DataTable< Customer >> = {
  title: 'UI/DataTable',
  component: DataTable,
};
export default meta;

type Story = StoryObj<typeof DataTable< Customer >>;

export const Default: Story = {
  args: {
    columns,
    data,
    loading: false,
    error: undefined,
    onRowClick: (row) => alert(`Clicked: ${row.name}`),
  },
};

export const Loading: Story = {
  args: {
    columns,
    data: [],
    loading: true,
  },
};

export const Error: Story = {
  args: {
    columns,
    data: [],
    error: 'Failed to load data',
  },
}; 