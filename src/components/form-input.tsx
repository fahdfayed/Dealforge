"use client";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className = "", ...props }: InputProps) {
  return (
    <div>
      {label && (
        <label className="mb-1 block text-xs font-medium text-slate-700">
          {label}
          {props.required && <span className="text-rose-600">*</span>}
        </label>
      )}
      <input
        className={`
          w-full rounded-md border px-3 py-2 text-sm
          transition-colors focus:outline-none focus:ring-2
          ${error ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500" : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"}
          disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, className = "", ...props }: TextareaProps) {
  return (
    <div>
      {label && (
        <label className="mb-1 block text-xs font-medium text-slate-700">
          {label}
          {props.required && <span className="text-rose-600">*</span>}
        </label>
      )}
      <textarea
        className={`
          w-full rounded-md border px-3 py-2 text-sm font-sans
          transition-colors focus:outline-none focus:ring-2
          ${error ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500" : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"}
          disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  children?: React.ReactNode;
}

export function Select({ label, error, hint, className = "", children, ...props }: SelectProps) {
  return (
    <div>
      {label && (
        <label className="mb-1 block text-xs font-medium text-slate-700">
          {label}
          {props.required && <span className="text-rose-600">*</span>}
        </label>
      )}
      <select
        className={`
          w-full rounded-md border px-3 py-2 text-sm
          transition-colors focus:outline-none focus:ring-2
          ${error ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500" : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"}
          disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
