import React from 'react';

const Card = ({
  children,
  className = '',
  padding = 'p-4',
  shadow = 'shadow-md',
  rounded = 'rounded-lg',
  hover = false,
}) => {
  return (
    <div
      className={`
        bg-white
        ${padding}
        ${shadow}
        ${rounded}
        ${hover ? 'hover:shadow-lg transition-shadow duration-200' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card; 