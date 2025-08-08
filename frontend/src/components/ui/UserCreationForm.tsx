import React, { useState } from 'react';
import ValidatedInput from './ValidatedInput';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';
import { 
  validateRegistrationForm, 
  validateField, 
  ValidationError,
  validateConfirmPassword,
  validateRole 
} from '../../utils/validation';

interface UserCreationFormProps {
  onSubmit: (userData: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const UserCreationForm: React.FC<UserCreationFormProps> = ({
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    company: '',
    phone: '',
  });
  
  const [fieldErrors, setFieldErrors] = useState<Record<string, ValidationError | null>>({});
  const [showErrors, setShowErrors] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Real-time validation for most fields
    if (name !== 'confirmPassword' && name !== 'role') {
      const fieldError = validateField(name, value, false); // isLogin = false for user creation
      setFieldErrors(prev => ({
        ...prev,
        [name]: fieldError,
      }));
    }

    // Validate role separately
    if (name === 'role') {
      const roleError = validateRole(value);
      setFieldErrors(prev => ({
        ...prev,
        role: roleError,
      }));
    }

    // Validate confirm password whenever password or confirmPassword changes
    if (name === 'password' || name === 'confirmPassword') {
      const confirmError = validateConfirmPassword(
        name === 'password' ? value : formData.password,
        name === 'confirmPassword' ? value : formData.confirmPassword
      );
      setFieldErrors(prev => ({
        ...prev,
        confirmPassword: confirmError,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowErrors(true);

    // Validate all fields
    const validation = validateRegistrationForm(formData);
    
    if (!validation.isValid) {
      // Convert validation errors to field errors
      const newFieldErrors: Record<string, ValidationError | null> = {};
      validation.errors.forEach(error => {
        newFieldErrors[error.field] = error;
      });
      setFieldErrors(newFieldErrors);
      return;
    }

    try {
      await onSubmit(formData);
      // Reset form on success
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'user',
        company: '',
        phone: '',
      });
      setFieldErrors({});
      setShowErrors(false);
      setSuccess('User created successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to create user. Please try again.');
    }
  };

  const hasErrors = Object.values(fieldErrors).some(error => error !== null);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Create New User
        </h3>
        <p className="text-sm text-gray-600">
          Fill in the details below to create a new user account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <div className="flex">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
            <div className="flex">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {success}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Name */}
          <div className="md:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <ValidatedInput
              name="name"
              type="text"
              placeholder="Enter full name"
              value={formData.name}
              onChange={handleChange}
              required
              error={fieldErrors.name}
              showError={showErrors}
              autoComplete="name"
            />
          </div>

          {/* Email */}
          <div className="md:col-span-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <ValidatedInput
              name="email"
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={handleChange}
              required
              error={fieldErrors.email}
              showError={showErrors}
              autoComplete="email"
            />
          </div>

          {/* Role */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Role *
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                fieldErrors.role && showErrors
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            {fieldErrors.role && showErrors && (
              <p className="text-sm text-red-600 flex items-center mt-1">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {fieldErrors.role.message}
              </p>
            )}
          </div>

          {/* Company */}
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
              Company Name
            </label>
            <ValidatedInput
              name="company"
              type="text"
              placeholder="Enter company name"
              value={formData.company}
              onChange={handleChange}
              error={fieldErrors.company}
              showError={showErrors}
              autoComplete="organization"
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <ValidatedInput
              name="phone"
              type="tel"
              placeholder="Enter phone number"
              value={formData.phone}
              onChange={handleChange}
              error={fieldErrors.phone}
              showError={showErrors}
              autoComplete="tel"
            />
          </div>

          {/* Password */}
          <div className="md:col-span-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <ValidatedInput
              name="password"
              type="password"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={handleChange}
              required
              error={fieldErrors.password}
              showError={showErrors}
              autoComplete="new-password"
            />
            {formData.password && (
              <div className="mt-2">
                <PasswordStrengthIndicator password={formData.password} />
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="md:col-span-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password *
            </label>
            <ValidatedInput
              name="confirmPassword"
              type="password"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              error={fieldErrors.confirmPassword}
              showError={showErrors}
              autoComplete="new-password"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || hasErrors}
            className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
              loading || hasErrors
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating user...
              </div>
            ) : (
              'Create User'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserCreationForm; 