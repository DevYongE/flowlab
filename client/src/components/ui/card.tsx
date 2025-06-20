import type { ReactNode } from 'react';

type CardProps = {
  className?: string;
  children: ReactNode;
};

export const Card: React.FC<CardProps> = ({ children, className }) => {
  return <div className={`bg-white rounded-lg shadow ${className}`}>{children}</div>;
};

export const CardHeader: React.FC<CardProps> = ({ children, className }) => {
  return <div className={`p-4 border-b ${className}`}>{children}</div>;
};

export const CardTitle: React.FC<CardProps> = ({ children, className }) => {
  return <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>;
};

type CardContentProps = {
  className?: string;
  children: ReactNode;
};

export const CardContent: React.FC<CardContentProps> = ({ children, className }) => {
  return <div className={`p-4 ${className}`}>{children}</div>;
};
