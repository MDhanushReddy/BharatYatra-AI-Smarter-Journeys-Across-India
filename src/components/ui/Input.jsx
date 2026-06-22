import React from 'react';

const Input = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  className = '',
  error,
  label,
  required = false,
  id,
  name,
  disabled = false,
}) => {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="form-label"
        >
          {label}
          {required && <span className="text-error">*</span>}
        </label>
      )}
      <input
        type={type}
        id={id}
        name={name}
        className={`form-input ${error ? 'error' : ''} ${className}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
      />
      {error && (
        <p className="form-error">{error}</p>
      )}
    </div>
  );
};

export default Input; 