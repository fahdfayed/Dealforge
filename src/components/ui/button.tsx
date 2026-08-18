"use client";

import React from "react";

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "outline";
}) {
  const baseStyles = "px-3 py-1.5 text-sm font-medium rounded border transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed";

  const variantClasses = {
    primary: "bg-[var(--odoo-accent)] text-white border-[var(--odoo-accent)] hover:bg-[var(--odoo-accent-light)]",
    secondary: "bg-[var(--surface-medium)] text-[var(--text-primary)] border-[var(--border-color)] hover:bg-[var(--surface-dark)]",
    danger: "bg-[var(--odoo-danger)] text-white border-[var(--odoo-danger)] hover:bg-[#c23321]",
    outline: "bg-transparent text-[var(--text-primary)] border-[var(--border-color)] hover:bg-[var(--surface-light)]",
  };

  return (
    <button
      {...props}
      className={`${baseStyles} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
