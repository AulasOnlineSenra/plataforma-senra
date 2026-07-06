"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  const renderDescription = (desc: any) => {
    if (typeof desc === 'string') {
      const parts = desc.split(/(https?:\/\/[^\s]+)/g);
      return parts.map((part, i) => 
        part.match(/^https?:\/\//) 
          ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-current opacity-90 hover:opacity-100">{part}</a> 
          : part
      );
    }
    return desc;
  }

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{renderDescription(description)}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
