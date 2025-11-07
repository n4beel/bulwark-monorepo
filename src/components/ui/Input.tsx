'use client';

import { LucideIcon } from 'lucide-react';
import React from 'react';
import Image from 'next/image';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
  iconSvg?: string; // Path to SVG file
  iconPosition?: 'left' | 'right';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { icon: Icon, iconSvg, iconPosition = 'left', className = '', ...props },
    ref,
  ) => {
    return (
      <div className="relative w-full">
        {(Icon || iconSvg) && iconPosition === 'left' && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none">
            {iconSvg ? (
              <Image
                src={iconSvg}
                alt="icon"
                width={20}
                height={20}
                className="w-5 h-5"
              />
            ) : Icon ? (
              <Icon className="w-5 h-5 text-gray-medium" />
            ) : null}
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full
            ${(Icon || iconSvg) && iconPosition === 'left' ? 'pl-12' : 'pl-4'}
            ${(Icon || iconSvg) && iconPosition === 'right' ? 'pr-12' : 'pr-4'}
            py-3
            bg-white
            rounded-lg
            border-2 border-blue-primary
            text-text-primary
            placeholder:text-gray-medium
            focus:outline-none
            focus:ring-0
            focus:border-blue-primary
            transition-all
            ${className}
          `}
          {...props}
        />
        {(Icon || iconSvg) && iconPosition === 'right' && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none">
            {iconSvg ? (
              <Image
                src={iconSvg}
                alt="icon"
                width={20}
                height={20}
                className="w-5 h-5"
              />
            ) : Icon ? (
              <Icon className="w-5 h-5 text-gray-medium" />
            ) : null}
          </div>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
