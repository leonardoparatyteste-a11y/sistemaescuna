import React from 'react';

export function Button({ 
  children, 
  variant = 'primary', 
  shortcut, 
  onClick, 
  className = '', 
  fullWidth = false,
  ...props 
}) {
  const baseClass = 'btn';
  const variantClass = `btn-${variant}`;
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button 
      className={`${baseClass} ${variantClass} ${widthClass} ${className}`}
      onClick={onClick}
      {...props}
    >
      <div className="flex items-center justify-center gap-2">
        {children}
        {shortcut && (
          <span className="text-xs bg-black/20 px-1.5 py-0.5 rounded ml-2 font-bold opacity-80">
            {shortcut}
          </span>
        )}
      </div>
    </button>
  );
}
