import React from 'react';

interface StudentOSLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  iconOnly?: boolean;
}

export const StudentOSLogo: React.FC<StudentOSLogoProps> = ({
  size = 'md',
  className = '',
  iconOnly = false,
}) => {
  const sizeMap = {
    sm: {
      container: 'w-7 h-7 rounded-lg',
      icon: 'w-4 h-4',
    },
    md: {
      container: 'w-9 h-9 rounded-xl',
      icon: 'w-5 h-5',
    },
    lg: {
      container: 'w-11 h-11 rounded-2xl',
      icon: 'w-6 h-6',
    },
  };

  const { container, icon } = sizeMap[size] || sizeMap.md;

  if (iconOnly) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${icon} select-none ${className}`}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 13h4" stroke="#4F46E5" strokeWidth="2.1" />
        <path d="M12 18h6a2 2 0 0 1 2 2v1" stroke="#4F46E5" strokeWidth="2.1" />
        <path d="M12 8h8" stroke="#4F46E5" strokeWidth="2.1" />
        <path d="M12 9a4.17 4.17 0 0 1-3 4" stroke="#4F46E5" strokeWidth="2.1" />
        <path d="M16 8V5a2 2 0 0 1 2-2" stroke="#4F46E5" strokeWidth="2.1" />
        <path d="M6 18a4 4 0 0 1-2-7.465" stroke="#4F46E5" strokeWidth="2.1" />
        <path d="M6.004 5.125a4 4 0 0 0-2.526 5.77" stroke="#4F46E5" strokeWidth="2.1" />
        <path d="M6.294 6.294A3 3 0 1 1 12 5v13a4 4 0 1 1-7.967-.518" stroke="#4F46E5" strokeWidth="2.1" />
        <circle cx="16" cy="13" r="1.15" fill="#2563EB" stroke="none" />
        <circle cx="18" cy="3" r="1.15" fill="#7C3AED" stroke="none" />
        <circle cx="20" cy="21" r="1.15" fill="#2563EB" stroke="none" />
        <circle cx="20" cy="8" r="1.15" fill="#7C3AED" stroke="none" />
      </svg>
    );
  }

  return (
    <div
      className={`${container} bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xs shadow-indigo-600/30 ring-1 ring-white/20 shrink-0 select-none ${className}`}
      aria-label="StudentOS Logo"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${icon} select-none`}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 13h4" stroke="#FFFFFF" strokeWidth="2.1" />
        <path d="M12 18h6a2 2 0 0 1 2 2v1" stroke="#FFFFFF" strokeWidth="2.1" />
        <path d="M12 8h8" stroke="#FFFFFF" strokeWidth="2.1" />
        <path d="M12 9a4.17 4.17 0 0 1-3 4" stroke="#FFFFFF" strokeWidth="2.1" />
        <path d="M16 8V5a2 2 0 0 1 2-2" stroke="#FFFFFF" strokeWidth="2.1" />
        <path d="M6 18a4 4 0 0 1-2-7.465" stroke="#FFFFFF" strokeWidth="2.1" />
        <path d="M6.004 5.125a4 4 0 0 0-2.526 5.77" stroke="#FFFFFF" strokeWidth="2.1" />
        <path d="M6.294 6.294A3 3 0 1 1 12 5v13a4 4 0 1 1-7.967-.518" stroke="#FFFFFF" strokeWidth="2.1" />
        <circle cx="16" cy="13" r="1.15" fill="#93C5FD" stroke="none" />
        <circle cx="18" cy="3" r="1.15" fill="#DDD6FE" stroke="none" />
        <circle cx="20" cy="21" r="1.15" fill="#93C5FD" stroke="none" />
        <circle cx="20" cy="8" r="1.15" fill="#DDD6FE" stroke="none" />
      </svg>
    </div>
  );
};
