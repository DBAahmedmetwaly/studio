
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

  // Wrap children in a function to pass down close function
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      // @ts-ignore
      return React.cloneElement(child, { onClose: () => setIsOpen(false), ...child.props });
    }
    return child;
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => {
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
