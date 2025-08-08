import React from 'react';
import { useForm } from 'react-hook-form';
import { Customer } from '../../types/models';

export interface CustomerFormProps {
  initial?: Partial<Customer>;
  loading?: boolean;
  error?: string;
  onSubmit: (data: Omit<Customer, 'id'>) => void;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({ initial, loading, error, onSubmit }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<Omit<Customer, 'id'>>({
    defaultValues: initial,
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      aria-label="Customer form"
      className="space-y-4 max-w-lg mx-auto bg-white p-6 rounded shadow"
    >
      <div>
        <label htmlFor="name" className="block font-medium">Name</label>
        <input
          id="name"
          {...register('name', { required: 'Name is required' })}
          className="input input-bordered w-full"
          aria-invalid={!!errors.name}
        />
        {errors.name && <span className="text-red-600">{errors.name.message}</span>}
      </div>
      <div>
        <label htmlFor="email" className="block font-medium">Email</label>
        <input
          id="email"
          type="email"
          {...register('email')}
          className="input input-bordered w-full"
        />
      </div>
      <div>
        <label htmlFor="phone" className="block font-medium">Phone</label>
        <input
          id="phone"
          type="tel"
          {...register('phone')}
          className="input input-bordered w-full"
        />
      </div>
      <div>
        <label htmlFor="company" className="block font-medium">Company</label>
        <input
          id="company"
          {...register('company')}
          className="input input-bordered w-full"
        />
      </div>
      <div>
        <label htmlFor="address" className="block font-medium">Address</label>
        <input
          id="address"
          {...register('address')}
          className="input input-bordered w-full"
        />
      </div>
      {error && <div role="alert" className="text-red-600">{error}</div>}
      <button
        type="submit"
        className="btn btn-primary"
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}; 