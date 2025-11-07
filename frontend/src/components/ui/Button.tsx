'use client';

import React from 'react';
import Image from 'next/image';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'dark' | 'outline';
  icon?: string; // Path to SVG file
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      icon,
      iconPosition = 'left',
      fullWidth = false,
      className = '',
      children,
      ...props
    },
    ref,
  ) => {
    const baseStyles = `
      inline-flex items-center justify-center gap-2
      px-6 py-2
      cursor-pointer
      rounded-xl
      font-medium
      transition-all
      focus:outline-none
      focus:ring-0
      disabled:opacity-50 disabled:cursor-not-allowed
      ${fullWidth ? 'w-full' : ''}
    `;

    const variants = {
      primary: `
        bg-blue-primary text-text-inverse
        hover:bg-blue-hover
      `,
      secondary: `
        bg-blue-secondary text-text-inverse
        hover:bg-blue-dark
      `,
      dark: `
        bg-gray-dark text-text-inverse
        hover:bg-black
      `,
      outline: `
        bg-white text-gray-dark
        border border-[var(--border-color)]
        hover:bg-gray-light
      `,
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${className}`}
        {...props}
      >
        {icon && iconPosition === 'left' && (
          <Image src={icon} alt="" width={20} height={20} className="w-5 h-5" />
        )}
        {children}
        {icon && iconPosition === 'right' && (
          <Image src={icon} alt="" width={20} height={20} className="w-5 h-5" />
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';

export default Button;
