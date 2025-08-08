import React from 'react';
import { CustomerForm } from '../CustomerForm';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof CustomerForm> = {
  title: 'UI/CustomerForm',
  component: CustomerForm,
};
export default meta;

type Story = StoryObj<typeof CustomerForm>;

export const Default: Story = {
  args: {
    initial: {
      name: '',
      email: '',
      phone: '',
      company: '',
      address: '',
      owner_id: 1,
    },
    loading: false,
    error: undefined,
    onSubmit: (data) => alert(JSON.stringify(data)),
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    onSubmit: () => {},
  },
};

export const Error: Story = {
  args: {
    error: 'Failed to save customer',
    onSubmit: () => {},
  },
}; 