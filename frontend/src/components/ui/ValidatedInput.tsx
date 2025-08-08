import React, { useState, useEffect } from 'react';
import { ValidationError } from '../../utils/validation';

interface ValidatedInputProps {
  name: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  required?: boolean;
  error?: ValidationError | null;
  showError?: boolean;
  className?: string;
  disabled?: boolean;
  autoComplete?: string;
}

const ValidatedInput: React.FC<ValidatedInputProps> = ({
  name,
  type,
  placeholder,
  value,
  onChange,
  onBlur,
  required = false,
  error,
  showError = false,
  className = '',
  disabled = false,
  autoComplete,
}) => {
  const [isTouched, setIsTouched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  const handleBlur = () => {
    setIsTouched(true);
    onBlur?.();
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(e.target.value.length > 0);
    onChange(e);
  };

  const shouldShowError = (showError || (isTouched && hasValue)) && error;
  const hasError = shouldShowError;

  const baseClasses = "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors";
  const errorClasses = "border-red-300 focus:ring-red-500 focus:border-red-500";
  const successClasses = "border-green-300 focus:ring-green-500 focus:border-green-500";
  const defaultClasses = "border-gray-300 focus:ring-blue-500 focus:border-blue-500";

  const inputClasses = `${baseClasses} ${
    hasError ? errorClasses : 
    isFocused && !hasError ? successClasses : 
    defaultClasses
  } ${className}`;

  return (
    <div className="space-y-1">
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        className={inputClasses}
      />
      {shouldShowError && (
        <p className="text-sm text-red-600 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error?.message}
        </p>
      )}
    </div>
  );
};

export default ValidatedInput; 