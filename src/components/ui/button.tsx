import React from "react";

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "outline";
}) {
  const baseStyles = "rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200";

  const variants = {
    primary: "text-white shadow-md hover:shadow-lg" + (props.disabled ? " opacity-60 cursor-not-allowed" : ""),
    secondary: "text-slate-700 bg-slate-100 hover:bg-slate-200",
    danger: "text-white hover:shadow-md",
    outline: "border border-slate-300 text-slate-700 hover:bg-slate-50",
  };

  const primaryStyle = props.disabled
    ? {}
    : {
        backgroundColor: "var(--intelloger-navy)",
      };

  const primaryHoverStyle = !props.disabled
    ? {
        backgroundColor: "var(--intelloger-navy-light)",
      }
    : {};

  const dangerStyle = props.disabled
    ? {}
    : {
        backgroundColor: "#ef4444",
      };

  const dangerHoverStyle = !props.disabled
    ? {
        backgroundColor: "#dc2626",
      }
    : {};

  const getStyleForVariant = () => {
    if (variant === "primary") {
      return primaryStyle;
    } else if (variant === "danger") {
      return dangerStyle;
    }
    return {};
  };

  return (
    <button
      {...props}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      style={getStyleForVariant()}
      onMouseEnter={(e) => {
        if (variant === "primary" && !props.disabled) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
            "var(--intelloger-navy-light)";
        } else if (variant === "danger" && !props.disabled) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#dc2626";
        }
        props.onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        if (variant === "primary" && !props.disabled) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
            "var(--intelloger-navy)";
        } else if (variant === "danger" && !props.disabled) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#ef4444";
        }
        props.onMouseLeave?.(e);
      }}
    >
      {children}
    </button>
  );
}
