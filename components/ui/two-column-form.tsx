"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface TwoColumnFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  /** Title for the form */
  title?: string
  /** Description for the form */
  description?: string
  /** Children to render in the form */
  children: React.ReactNode
  /** Footer content */
  footer?: React.ReactNode
  /** Submit button text */
  submitText?: string
  /** Cancel button text */
  cancelText?: string
  /** Function to call when the cancel button is clicked */
  onCancel?: () => void
  /** Whether the form is loading */
  isLoading?: boolean
  /** Additional class name for the card */
  cardClassName?: string
  /** Additional class name for the form */
  formClassName?: string
  /** Whether to show the footer */
  showFooter?: boolean
  /** Whether to show the header */
  showHeader?: boolean
}

export function TwoColumnForm({
  title,
  description,
  children,
  footer,
  submitText = "Submit",
  cancelText = "Cancel",
  onCancel,
  isLoading = false,
  cardClassName,
  formClassName,
  showFooter = true,
  showHeader = true,
  ...props
}: TwoColumnFormProps) {
  return (
    <Card className={cn("w-full", cardClassName)}>
      {showHeader && (title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <form {...props} className={cn("space-y-8", formClassName)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {children}
          </div>
          
          {!showFooter && (
            <div className="flex justify-end gap-3 pt-4">
              {onCancel && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel}
                  disabled={isLoading}
                >
                  {cancelText}
                </Button>
              )}
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Loading..." : submitText}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
      
      {showFooter && footer && (
        <CardFooter className="flex justify-end gap-3">
          {footer}
        </CardFooter>
      )}
      
      {showFooter && !footer && (
        <CardFooter className="flex justify-end gap-3">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isLoading}
            >
              {cancelText}
            </Button>
          )}
          <Button 
            type="submit" 
            form={props.id} 
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : submitText}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

interface FormSectionProps {
  /** Title for the section */
  title?: string
  /** Children to render in the section */
  children: React.ReactNode
  /** Whether the section spans both columns */
  fullWidth?: boolean
  /** Additional class name for the section */
  className?: string
}

export function FormSection({
  title,
  children,
  fullWidth = false,
  className,
}: FormSectionProps) {
  return (
    <div className={cn(
      "space-y-4",
      fullWidth ? "md:col-span-2" : "",
      className
    )}>
      {title && (
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}
