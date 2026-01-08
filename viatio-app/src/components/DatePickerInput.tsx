/**
 * DATE PICKER INPUT
 *
 * Wrapper sobre DateInput con props compatibles con los screens shared.
 * Alias para mantener compatibilidad con nomenclatura existente.
 */

import { DateInput } from './DateInput';

interface DatePickerInputProps {
  label: string;
  value: string; // ISO string (YYYY-MM-DD)
  onChange: (date: string) => void;
  placeholder?: string;
  error?: string;
  minDate?: Date;
  maxDate?: Date;
}

export function DatePickerInput({
  label,
  value,
  onChange,
  placeholder,
  error,
  minDate,
  maxDate,
}: DatePickerInputProps) {
  return (
    <DateInput
      label={label}
      value={value}
      onChangeDate={onChange}
      placeholder={placeholder}
      error={error}
      minDate={minDate}
      maxDate={maxDate}
    />
  );
}
