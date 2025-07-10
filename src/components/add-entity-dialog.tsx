"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
        <DialogFooter>
          <Button type="submit" onClick={() => setIsOpen(false)}>حفظ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
