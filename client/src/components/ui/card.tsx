import type { ReactNode } from 'react';

type CardProps = {
  className?: string;
  children: ReactNode;
  padding?: 'default' | 'sm' | 'lg' | 'none';
};

export const Card: React.FC<CardProps> = ({ children, className, padding = 'default' }) => {
  const paddingClasses = {
    default: 'p-4 md:p-6',
    sm: 'p-2 md:p-4',
    lg: 'p-6 md:p-8',
    none: 'p-0'
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 ${paddingClasses[padding]} ${className || ''}`}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={`pb-3 md:pb-4 border-b border-gray-200 ${className || ''}`}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<CardProps> = ({ children, className }) => {
  return (
    <h3 className={`text-lg md:text-xl font-semibold text-gray-900 ${className || ''}`}>
      {children}
    </h3>
  );
};

type CardContentProps = {
  className?: string;
  children: ReactNode;
  padding?: 'default' | 'sm' | 'lg' | 'none';
};

export const CardContent: React.FC<CardContentProps> = ({ children, className, padding = 'default' }) => {
  const paddingClasses = {
    default: 'p-4 md:p-6',
    sm: 'p-2 md:p-4',
    lg: 'p-6 md:p-8',
    none: 'p-0'
  };

  return (
    <div className={`${paddingClasses[padding]} ${className || ''}`}>
      {children}
    </div>
  );
};
