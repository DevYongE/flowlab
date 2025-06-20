import React from 'react';

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export const Input: React.FC<Props> = (props) => {
  return (
    <input
      {...props}
      className={`border border-gray-300 px-4 py-2 rounded ${props.className || ''}`}
    />
  );
};