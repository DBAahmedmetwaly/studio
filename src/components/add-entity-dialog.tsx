
"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AddEntityDialogProps {
  triggerButton: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}

export function AddEntityDialog({
  triggerButton,
  title,
  description,
  children,
}: AddEntityDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Wrap the original trigger to control the dialog's open state
  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen(true);
  };
  
  const TriggerWrapper = React.isValidElement(triggerButton) 
    ? React.cloneElement(triggerButton, { onClick: handleTriggerClick } as React.HTMLAttributes<HTMLElement>)
    : <div onClick={handleTriggerClick}>{triggerButton}</div>;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{TriggerWrapper}</DialogTrigger>
      <DialogContent 
        className="sm:max-w-[425px]"
        onInteractOutside={(e) => {
          // This prevents closing the dialog when interacting with select/dropdown menus
          if ((e.target as HTMLElement).closest('[data-radix-popper-content-wrapper]')) {
            e.preventDefault();
          }
        }}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {React.Children.map(children, child =>
          React.isValidElement(child)
            ? React.cloneElement(child, { onClose: () => setIsOpen(false) } as any)
            : child
        )}
      </DialogContent>
    </Dialog>
  );
}
