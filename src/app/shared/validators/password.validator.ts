import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validates password strength:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one number
 * - At least one special character
 */
export function passwordStrengthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: string = control.value ?? '';
    if (!value) return null;

    const errors: ValidationErrors = {};

    if (value.length < 8) errors['minLength'] = { requiredLength: 8, actualLength: value.length };
    if (!/[A-Z]/.test(value)) errors['uppercase'] = true;
    if (!/[0-9]/.test(value)) errors['number'] = true;
    if (!/[!@#$%^&*()\-_=+\[\]{};:'",.<>?/\\|`~]/.test(value)) errors['specialChar'] = true;

    return Object.keys(errors).length > 0 ? errors : null;
  };
}

/**
 * Cross-field validator: ensures two password fields match.
 * Apply at the FormGroup level.
 * @param passwordKey  name of the password control
 * @param confirmKey   name of the confirm-password control
 */
export function passwordMatchValidator(passwordKey: string, confirmKey: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get(passwordKey)?.value;
    const confirm = group.get(confirmKey)?.value;

    if (password && confirm && password !== confirm) {
      group.get(confirmKey)?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    // Clear the cross-field error if they match (keep other existing errors)
    const confirmControl = group.get(confirmKey);
    if (confirmControl?.hasError('passwordMismatch')) {
      const { passwordMismatch: _, ...rest } = confirmControl.errors ?? {};
      confirmControl.setErrors(Object.keys(rest).length > 0 ? rest : null);
    }

    return null;
  };
}
