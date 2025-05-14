"use client"

import * as React from "react"
import { X, CheckCircle2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export interface FormFieldProps {
  /** The name of the form field */
  name: string
  /** The label text to display */
  label: string
  /** The type of input */
  type?: string
  /** The placeholder text */
  placeholder?: string
  /** The current value of the field */
  value?: string
  /** Whether the field is required */
  required?: boolean
  /** Whether the field is disabled */
  disabled?: boolean
  /** Whether the field is readonly */
  readOnly?: boolean
  /** Error message to display */
  error?: string
  /** Success message to display */
  success?: string
  /** Help text to display below the field */
  helpText?: string
  /** The state of the field */
  state?: "default" | "active" | "filled" | "error" | "success"
  /** Whether to show a clear button */
  showClear?: boolean
  /** Whether to show a character counter */
  showCharCount?: boolean
  /** Maximum character count */
  maxLength?: number
  /** Whether to show the result count */
  showResultCount?: boolean
  /** The number of results */
  resultCount?: number
  /** Function to call when the value changes */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  /** Function to call when the clear button is clicked */
  onClear?: () => void
  /** Additional class names for the container */
  className?: string
  /** Icon to display at the start of the input */
  startIcon?: React.ReactNode
  /** Icon to display at the end of the input */
  endIcon?: React.ReactNode
  /** Button to display at the end of the input */
  endButton?: React.ReactNode
}

export function FormField({
  name,
  label,
  type = "text",
  placeholder,
  value = "",
  required = false,
  disabled = false,
  readOnly = false,
  error,
  success,
  helpText,
  state = "default",
  showClear = false,
  showCharCount = false,
  maxLength,
  showResultCount = false,
  resultCount,
  onChange,
  onClear,
  className,
  startIcon,
  endIcon,
  endButton
}: FormFieldProps) {
  // Determine the visual state based on props
  const visualState = error ? "error" : success ? "success" : state
  
  // Generate border color based on state
  const getBorderColor = () => {
    switch (visualState) {
      case "active":
        return "border-primary"
      case "error":
        return "border-destructive"
      case "success":
        return "border-green-500"
      default:
        return "border-input"
    }
  }

  // Generate ring color based on state
  const getRingColor = () => {
    switch (visualState) {
      case "active":
        return "ring-2 ring-primary/20"
      case "error":
        return "ring-2 ring-destructive/20"
      case "success":
        return "ring-2 ring-green-500/20"
      default:
        return ""
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Label */}
      <div className="flex justify-between items-center">
        <Label 
          htmlFor={name}
          className={cn(
            "text-sm font-medium",
            visualState === "error" && "text-destructive"
          )}
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        
        {/* Character counter */}
        {showCharCount && maxLength && (
          <span className="text-xs text-muted-foreground">
            {value.length} / {maxLength}
          </span>
        )}
      </div>
      
      {/* Input wrapper */}
      <div 
        className={cn(
          "relative flex items-center rounded-md border",
          getBorderColor(),
          getRingColor()
        )}
      >
        {/* Start icon */}
        {startIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {startIcon}
          </div>
        )}
        
        {/* Input element */}
        <Input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          maxLength={maxLength}
          className={cn(
            "border-0 shadow-none",
            startIcon && "pl-9",
            (endIcon || showClear || endButton) && "pr-9"
          )}
        />
        
        {/* Result count */}
        {showResultCount && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {resultCount} results
          </div>
        )}
        
        {/* Clear button */}
        {showClear && value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={onClear}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear</span>
          </Button>
        )}
        
        {/* End icon */}
        {endIcon && !showClear && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {endIcon}
          </div>
        )}
        
        {/* End button */}
        {endButton && !showClear && !endIcon && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {endButton}
          </div>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <div className="flex items-center gap-1.5 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          <p>{error}</p>
        </div>
      )}
      
      {/* Success message */}
      {success && (
        <div className="flex items-center gap-1.5 text-green-500 text-sm">
          <CheckCircle2 className="h-4 w-4" />
          <p>{success}</p>
        </div>
      )}
      
      {/* Help text */}
      {helpText && !error && !success && (
        <p className="text-sm text-muted-foreground">{helpText}</p>
      )}
    </div>
  )
}
