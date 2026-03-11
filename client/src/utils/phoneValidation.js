// Uzbekistan phone number validation and formatting

export const formatPhoneNumber = (value) => {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');
  
  // Handle international format starting with 998
  if (digits.startsWith('998')) {
    const number = digits.slice(3, 12); // Take 9 digits after 998
    if (number.length === 0) return '+998 ';
    if (number.length <= 2) return `+998 ${number}`;
    if (number.length <= 5) return `+998 ${number.slice(0, 2)} ${number.slice(2)}`;
    if (number.length <= 7) return `+998 ${number.slice(0, 2)} ${number.slice(2, 5)} ${number.slice(5)}`;
    return `+998 ${number.slice(0, 2)} ${number.slice(2, 5)} ${number.slice(5, 7)} ${number.slice(7, 9)}`;
  }
  
  // Handle local format (9 digits)
  if (digits.length === 0) return '';
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
  if (digits.length <= 7) return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
  if (digits.length <= 9) return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`;
  
  // Limit to 9 digits for local format
  const limited = digits.slice(0, 9);
  return `${limited.slice(0, 2)} ${limited.slice(2, 5)} ${limited.slice(5, 7)} ${limited.slice(7)}`;
};

export const validatePhoneNumber = (value) => {
  const digits = value.replace(/\D/g, '');
  
  // Accept international format: +998 XX XXX XX XX (12 digits total)
  if (digits.startsWith('998')) {
    return digits.length === 12;
  }
  
  // Accept local format: XX XXX XX XX (9 digits)
  return digits.length === 9;
};

export const isValidUzbekPhoneNumber = (value) => {
  const digits = value.replace(/\D/g, '');
  
  // Check if it's international format
  if (digits.startsWith('998')) {
    // Must be exactly 12 digits (998 + 9 digits)
    if (digits.length !== 12) return false;
    // Check if the operator code is valid (90-99)
    const operatorCode = digits.slice(3, 5);
    return parseInt(operatorCode) >= 90 && parseInt(operatorCode) <= 99;
  }
  
  // Check if it's local format
  if (digits.length === 9) {
    // Check if the operator code is valid (90-99)
    const operatorCode = digits.slice(0, 2);
    return parseInt(operatorCode) >= 90 && parseInt(operatorCode) <= 99;
  }
  
  return false;
};
