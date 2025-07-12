import React from 'react';

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  fullWidth?: boolean;
  error?: boolean;
  size?: 'default' | 'sm' | 'lg';
};

const sizes = {
  default: 'px-3 py-2 text-sm md:text-base',
  sm: 'px-2 py-1 text-xs md:text-sm',
  lg: 'px-4 py-3 text-base md:text-lg',
};

export const Input: React.FC<Props> = ({ 
  fullWidth = true, 
  error = false, 
  size = 'default',
  ...props 
}) => {
  return (
    <input
      {...props}
      className={`
        border border-gray-300 rounded-md
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        touch-manipulation
        ${sizes[size as keyof typeof sizes]}
        ${fullWidth ? 'w-full' : ''}
        ${error ? 'border-red-500 focus:ring-red-500' : ''}
        ${props.disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
        ${props.className || ''}
      `.trim().replace(/\s+/g, ' ')}
    />
  );
};