export const ACCEPTED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg'];

export const validateFileType = (file: File): boolean => {
  return ACCEPTED_FILE_TYPES.includes(file.type);
};

export const validateFileSize = (file: File, maxSizeInMB: number = 10): boolean => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  // At least 6 characters
  return password.length >= 6;
};

export const validatePatientId = (patientId: string): boolean => {
  // Should be in format ***1234 (3 asterisks followed by 4 digits)
  const patientIdRegex = /^\*\*\*\d{4}$/;
  return patientIdRegex.test(patientId);
};

export const validateRupiahAmount = (amount: number): boolean => {
  return amount > 0 && amount <= 999999999; // Max 999 million
};

export const validateDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

export const validateProviderName = (name: string): boolean => {
  return name.length > 0 && name.length <= 100;
};

export const validateDiagnosis = (diagnosis: string): boolean => {
  return diagnosis.length > 0 && diagnosis.length <= 200;
};

export const validateFileName = (fileName: string): boolean => {
  // Check if filename has valid extension
  const validExtensions = ['.pdf', '.jpg', '.jpeg'];
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return validExtensions.includes(extension);
};

export const sanitizeInput = (input: string): string => {
  // Remove potentially harmful characters
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .trim();
};

export const validateSearchTerm = (term: string): boolean => {
  // Allow alphanumeric, spaces, and common punctuation
  const searchRegex = /^[a-zA-Z0-9\s\-_.@*]+$/;
  return term.length <= 50 && (term === '' || searchRegex.test(term));
};

export const formatValidationError = (field: string, rule: string): string => {
  const errorMessages: Record<string, Record<string, string>> = {
    file: {
      type: 'Please upload PDF, JPG, or JPEG files only',
      size: 'File size must be less than 10MB',
    },
    email: {
      format: 'Please enter a valid email address',
      required: 'Email address is required',
    },
    password: {
      length: 'Password must be at least 6 characters long',
      required: 'Password is required',
    },
    amount: {
      positive: 'Amount must be greater than 0',
      max: 'Amount cannot exceed Rp 999.999.999',
    },
    date: {
      format: 'Please enter a valid date',
      required: 'Date is required',
    }
  };

  return errorMessages[field]?.[rule] || `Invalid ${field}`;
};

export const ERROR_MESSAGES = {
  UNREADABLE_FILE: "File is unreadable. Please submit a more readable file. We recommend a computer generated file, like PDF.",
  RATE_LIMIT: "You're hitting the limit. Please contact Strator",
  MISSING_INFO: "We couldn't find such information in the file",
  INVALID_FILE_TYPE: "Invalid file type. Please upload PDF, JPG, or JPEG files only.",
  FILE_TOO_LARGE: "File size too large. Maximum size is 10MB.",
  NETWORK_ERROR: "Network error occurred. Please check your connection and try again.",
  API_ERROR: "An error occurred while processing your request. Please try again.",
};
