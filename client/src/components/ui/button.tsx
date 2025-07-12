import React from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'destructive' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
};

const variants = {
  default: 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700',
  destructive: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700',
  outline: 'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200',
};

const sizes = {
    default: 'px-4 py-2 text-sm md:text-base',
    sm: 'px-2 py-1 text-xs md:text-sm',
    lg: 'px-6 py-3 text-base md:text-lg',
}

export const Button: React.FC<Props> = ({ 
  children, 
  variant = 'default', 
  size = 'default', 
  fullWidth = false, 
  loading = false, 
  disabled,
  ...props 
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={`
        rounded-md transition-all duration-200 font-medium
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        touch-manipulation
        ${variants[variant]} 
        ${sizes[size]} 
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${loading ? 'relative' : ''}
        ${props.className || ''}
      `.trim().replace(/\s+/g, ' ')}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </span>
      )}
      <span className={loading ? 'opacity-0' : ''}>
        {children}
      </span>
    </button>
  );
};