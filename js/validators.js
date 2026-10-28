/**
 * Dharashiv Foundation - Form & Input Validators
 */

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidUrl(url) {
  if (!url) return true; // Optional fields can be empty
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateField(inputElement, rules = {}) {
  const group = inputElement.closest('.form-group');
  const errorEl = group ? group.querySelector('.form-error') : null;
  const value = inputElement.value.trim();

  let errorMessage = '';

  if (rules.required && !value) {
    errorMessage = `${rules.label || 'This field'} is required.`;
  } else if (rules.email && value && !isValidEmail(value)) {
    errorMessage = 'Please enter a valid email address.';
  } else if (rules.url && value && !isValidUrl(value)) {
    errorMessage = 'Please enter a valid website URL (starting with http:// or https://).';
  } else if (rules.minLength && value.length < rules.minLength) {
    errorMessage = `Must be at least ${rules.minLength} characters.`;
  }

  if (group) {
    if (errorMessage) {
      group.classList.add('has-error');
      if (errorEl) errorEl.textContent = errorMessage;
      return false;
    } else {
      group.classList.remove('has-error');
      if (errorEl) errorEl.textContent = '';
      return true;
    }
  }

  return !errorMessage;
}

export function validateFile(file, allowedMimes, maxSizeBytes) {
  if (!file) return { valid: false, error: 'No file selected.' };

  if (allowedMimes && !allowedMimes.includes(file.type)) {
    return {
      valid: false,
      error: `File type '${file.type || 'unknown'}' is not allowed. Please choose an accepted format.`
    };
  }

  if (maxSizeBytes && file.size > maxSizeBytes) {
    const maxMb = (maxSizeBytes / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max allowed: ${maxMb}MB.`
    };
  }

  return { valid: true, error: null };
}
