// Validation utility functions for frontend forms

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Email validation
export const validateEmail = (email: string): ValidationError | null => {
  if (!email) {
    return { field: 'email', message: 'Email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { field: 'email', message: 'Please enter a valid email address' };
  }
  
  if (email.length > 254) {
    return { field: 'email', message: 'Email address is too long' };
  }
  
  return null;
};

// Username/Name validation
export const validateName = (name: string): ValidationError | null => {
  if (!name) {
    return { field: 'name', message: 'Name is required' };
  }
  
  if (name.trim().length < 2) {
    return { field: 'name', message: 'Name must be at least 2 characters long' };
  }
  
  if (name.trim().length > 50) {
    return { field: 'name', message: 'Name must be less than 50 characters' };
  }
  
  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(name.trim())) {
    return { field: 'name', message: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }
  
  return null;
};

// Password validation
export const validatePassword = (password: string): ValidationError | null => {
  if (!password) {
    return { field: 'password', message: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { field: 'password', message: 'Password must be at least 8 characters long' };
  }
  
  if (password.length > 128) {
    return { field: 'password', message: 'Password must be less than 128 characters' };
  }
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { field: 'password', message: 'Password must contain at least one uppercase letter' };
  }
  
  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { field: 'password', message: 'Password must contain at least one lowercase letter' };
  }
  
  // Check for at least one number
  if (!/\d/.test(password)) {
    return { field: 'password', message: 'Password must contain at least one number' };
  }
  
  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { field: 'password', message: 'Password must contain at least one special character' };
  }
  
  return null;
};

// Confirm password validation
export const validateConfirmPassword = (password: string, confirmPassword: string): ValidationError | null => {
  if (!confirmPassword) {
    return { field: 'confirmPassword', message: 'Please confirm your password' };
  }
  
  if (password !== confirmPassword) {
    return { field: 'confirmPassword', message: 'Passwords do not match' };
  }
  
  return null;
};

// Phone number validation (optional)
export const validatePhone = (phone: string): ValidationError | null => {
  if (!phone) {
    return null; // Phone is optional
  }
  
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
    return { field: 'phone', message: 'Please enter a valid phone number' };
  }
  
  return null;
};

// Company name validation (optional)
export const validateCompany = (company: string): ValidationError | null => {
  if (!company) {
    return null; // Company is optional
  }
  
  if (company.trim().length < 2) {
    return { field: 'company', message: 'Company name must be at least 2 characters long' };
  }
  
  if (company.trim().length > 100) {
    return { field: 'company', message: 'Company name must be less than 100 characters' };
  }
  
  return null;
};

// Role validation
export const validateRole = (role: string): ValidationError | null => {
  if (!role) {
    return { field: 'role', message: 'Role is required' };
  }
  
  const validRoles = ['user', 'admin'];
  if (!validRoles.includes(role)) {
    return { field: 'role', message: 'Please select a valid role' };
  }
  
  return null;
};

// Registration form validation
export const validateRegistrationForm = (formData: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role?: string;
  company?: string;
  phone?: string;
}): ValidationResult => {
  const errors: ValidationError[] = [];
  
  // Validate name
  const nameError = validateName(formData.name);
  if (nameError) errors.push(nameError);
  
  // Validate email
  const emailError = validateEmail(formData.email);
  if (emailError) errors.push(emailError);
  
  // Validate password
  const passwordError = validatePassword(formData.password);
  if (passwordError) errors.push(passwordError);
  
  // Validate confirm password
  const confirmPasswordError = validateConfirmPassword(formData.password, formData.confirmPassword);
  if (confirmPasswordError) errors.push(confirmPasswordError);
  
  // Validate role if provided
  if (formData.role) {
    const roleError = validateRole(formData.role);
    if (roleError) errors.push(roleError);
  }
  
  // Validate company if provided
  if (formData.company) {
    const companyError = validateCompany(formData.company);
    if (companyError) errors.push(companyError);
  }
  
  // Validate phone if provided
  if (formData.phone) {
    const phoneError = validatePhone(formData.phone);
    if (phoneError) errors.push(phoneError);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Login form validation
export const validateLoginForm = (formData: {
  email: string;
  password: string;
}): ValidationResult => {
  const errors: ValidationError[] = [];
  
  // Validate email
  const emailError = validateEmail(formData.email);
  if (emailError) errors.push(emailError);
  
  // Validate password (basic check for login - only check if not empty)
  if (!formData.password) {
    errors.push({ field: 'password', message: 'Password is required' });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Password strength indicator
export const getPasswordStrength = (password: string): {
  score: number;
  label: string;
  color: string;
} => {
  if (!password) {
    return { score: 0, label: 'No password', color: 'text-gray-400' };
  }
  
  let score = 0;
  
  // Length check
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  
  // Character variety checks
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;
  
  // Determine label and color
  if (score <= 2) {
    return { score, label: 'Weak', color: 'text-red-500' };
  } else if (score <= 4) {
    return { score, label: 'Fair', color: 'text-yellow-500' };
  } else if (score <= 6) {
    return { score, label: 'Good', color: 'text-blue-500' };
  } else {
    return { score, label: 'Strong', color: 'text-green-500' };
  }
};

// Real-time validation helper
export const validateField = (fieldName: string, value: string, isLogin: boolean = false): ValidationError | null => {
  switch (fieldName) {
    case 'name':
      return validateName(value);
    case 'email':
      return validateEmail(value);
    case 'password':
      // For login, only check if password is not empty
      if (isLogin) {
        return !value ? { field: 'password', message: 'Password is required' } : null;
      }
      // For registration, use full password validation
      return validatePassword(value);
    case 'confirmPassword':
      return null; // This needs to be validated with password
    case 'phone':
      return validatePhone(value);
    case 'company':
      return validateCompany(value);
    case 'role':
      return validateRole(value);
    default:
      return null;
  }
}; 