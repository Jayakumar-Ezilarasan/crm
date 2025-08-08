import React from 'react';
import { getPasswordStrength } from '../../utils/validation';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  className = '',
}) => {
  const strength = getPasswordStrength(password);

  if (!password) return null;

  // Check if all password requirements are met
  const allRequirementsMet = 
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  // Hide the indicator if all requirements are met
  if (allRequirementsMet) return null;

  const getStrengthBars = () => {
    const bars = [];
    const maxBars = 6;
    
    for (let i = 0; i < maxBars; i++) {
      const isActive = i < strength.score;
      const barColor = isActive 
        ? strength.color.replace('text-', 'bg-') 
        : 'bg-gray-200';
      
      bars.push(
        <div
          key={i}
          className={`h-1 rounded-full transition-all duration-200 ${barColor}`}
        />
      );
    }
    
    return bars;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex space-x-1">
        {getStrengthBars()}
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className={`font-medium ${strength.color}`}>
          Password strength: {strength.label}
        </span>
        <span className="text-gray-500">
          {strength.score}/6
        </span>
      </div>
      <div className="text-xs text-gray-600 space-y-1">
        <p>Password must contain:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li className={password.length >= 8 ? 'text-green-600' : 'text-gray-400'}>
            At least 8 characters
          </li>
          <li className={/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-400'}>
            One uppercase letter
          </li>
          <li className={/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-400'}>
            One lowercase letter
          </li>
          <li className={/\d/.test(password) ? 'text-green-600' : 'text-gray-400'}>
            One number
          </li>
          <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 'text-green-600' : 'text-gray-400'}>
            One special character
          </li>
        </ul>
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator; 