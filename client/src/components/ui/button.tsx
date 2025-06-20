import React from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'destructive' | 'outline';
  size?: 'default' | 'sm' | 'lg';
};

const variants = {
  default: 'bg-blue-500 text-white hover:bg-blue-600',
  destructive: 'bg-red-500 text-white hover:bg-red-600',
  outline: 'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-100',
};

const sizes = {
    default: 'px-4 py-2',
    sm: 'px-2 py-1 text-sm',
    lg: 'px-6 py-3 text-lg',
}

export const Button: React.FC<Props> = ({ children, variant = 'default', size = 'default', ...props }) => {
  return (
    <button
      {...props}
      className={`rounded ${variants[variant]} ${sizes[size]} ${props.className || ''}`}
    >
      {children}
    </button>
  );
};