"use client";

import React from "react";

interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function ButtonGroup({ children, className = "" }: ButtonGroupProps) {
  return <div className={`flex flex-wrap gap-2 ${className}`}>{children}</div>;
}

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export function ActionButton({
  variant = "secondary",
  size = "md",
  loading = false,
  icon,
  children,
  className = "",
  disabled,
  ...props
}: ActionButtonProps) {
  const baseStyles = "font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 justify-center";

  const sizeStyles = {
    sm: "px-2 py-1.5 text-xs",
    md: "px-3 py-2 text-sm",
    lg: "px-4 py-2.5 text-sm",
  };

  const variantStyles = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-500 focus:ring-indigo-500",
    secondary: "border border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-slate-500",
    danger: "bg-rose-600 text-white hover:bg-rose-500 focus:ring-rose-500",
    outline: "border border-slate-300 text-slate-700 hover:border-slate-400 focus:ring-slate-500",
    ghost: "text-slate-700 hover:bg-slate-50 focus:ring-slate-500",
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {icon && !loading && icon}
      {loading && <span className="animate-spin">⟳</span>}
      {children}
    </button>
  );
}
