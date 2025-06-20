import React from 'react';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

const ContentWrapper: React.FC<Props> = ({ children }) => {
  return <div className="flex-1 p-8 space-y-6">{children}</div>;
};

export default ContentWrapper;