import * as React from "react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const AlertDialog = ({ open, onOpenChange, children }) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg rounded-lg">
        {children}
      </div>
    </div>
  );
};

const AlertDialogTrigger = ({ children, ...props }) => children;

const AlertDialogContent = ({ className, children, ...props }) => (
  <div className={cn("space-y-4", className)} {...props}>
    {children}
  </div>
);

const AlertDialogHeader = ({ className, children, ...props }) => (
  <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props}>
    {children}
  </div>
);

const AlertDialogFooter = ({ className, children, ...props }) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props}>
    {children}
  </div>
);

const AlertDialogTitle = ({ className, children, ...props }) => (
  <h2 className={cn("text-lg font-semibold", className)} {...props}>
    {children}
  </h2>
);

const AlertDialogDescription = ({ className, children, ...props }) => (
  <p className={cn("text-sm text-gray-600", className)} {...props}>
    {children}
  </p>
);

const AlertDialogAction = ({ className, onClick, children, ...props }) => (
  <button
    className={cn(buttonVariants(), className)}
    onClick={onClick}
    {...props}
  >
    {children}
  </button>
);

const AlertDialogCancel = ({ className, onClick, children, ...props }) => (
  <button
    className={cn(buttonVariants({ variant: "outline" }), "mt-2 sm:mt-0", className)}
    onClick={onClick}
    {...props}
  >
    {children}
  </button>
);

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}