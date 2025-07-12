
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

  // Wrap the trigger button to manually control the dialog state
  const Trigger = React.cloneElement(triggerButton as React.ReactElement, {
    onClick: (e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setIsOpen(true);
        // If the original trigger has an onClick, call it
        if ((triggerButton as React.ReactElement).props.onClick) {
            (triggerButton as React.ReactElement).props.onClick(e);
        }
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{Trigger}</DialogTrigger>
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
        {React.cloneElement(children as React.ReactElement, { onClose: () => setIsOpen(false) })}
      </DialogContent>
    </Dialog>
  );
}
