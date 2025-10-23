import { forwardRef } from "react";

const Textarea = forwardRef(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={`w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    {...props}
  />
));

Textarea.displayName = "Textarea";

export { Textarea };
