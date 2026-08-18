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

  const variantStyles = {
    primary: {
      backgroundColor: "var(--odoo-accent)",
      color: "white",
      borderColor: "var(--odoo-accent)",
    },
    secondary: {
      backgroundColor: "var(--surface-medium)",
      color: "var(--text-primary)",
      borderColor: "var(--border-color)",
    },
    danger: {
      backgroundColor: "var(--odoo-danger)",
      color: "white",
      borderColor: "var(--odoo-danger)",
    },
    outline: {
      backgroundColor: "transparent",
      color: "var(--text-primary)",
      borderColor: "var(--border-color)",
    },
  };

  const getHoverStyle = (v: "primary" | "secondary" | "danger" | "outline") => {
    if (props.disabled) return {};
    switch (v) {
      case "primary":
        return { backgroundColor: "var(--odoo-accent-light)" };
      case "secondary":
        return { backgroundColor: "var(--surface-dark)" };
      case "danger":
        return { backgroundColor: "var(--odoo-danger-hover, #c23321)" };
      case "outline":
        return { backgroundColor: "var(--surface-light)" };
      default:
        return {};
    }
  };

  const style = variantStyles[variant];

  return (
    <button
      {...props}
      className={`${baseStyles} ${className}`}
      style={style}
      onMouseEnter={(e) => {
        if (!props.disabled) {
          const hoverStyle = getHoverStyle(variant);
          Object.assign((e.currentTarget as HTMLButtonElement).style, hoverStyle);
        }
        props.onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        Object.assign((e.currentTarget as HTMLButtonElement).style, style);
        props.onMouseLeave?.(e);
      }}
    >
      {children}
    </button>
  );
}
