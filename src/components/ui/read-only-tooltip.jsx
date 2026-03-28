import React from "react";
import { useSubscription } from "@/hooks/useSubscription";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ReadOnlyTooltip({ children, isReadOnlyOverride, message = "Read-only mode active: Upgrade your plan to perform this action.", className = "" }) {
  const { isReadOnly: hookIsReadOnly } = useSubscription();
  const isReadOnly = isReadOnlyOverride ?? hookIsReadOnly;

  if (!isReadOnly) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <span tabIndex={0} className={`inline-block cursor-not-allowed ${className}`}>
            {/* 
              Wrap the child in a div/span that intercepts pointer events.
              Because disabled elements don't fire events, we must ensure pointer-events are captured 
              here and the child respects them. 
              We use cloneElement to apply disabled state natively while letting the span catch hovers.
            */}
            {React.isValidElement(children) ? React.cloneElement(children, {
               disabled: true,
               // Make sure the child doesn't block pointer events for the tooltip wrapper
               style: { ...children.props.style, pointerEvents: 'none' } 
            }) : children}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-slate-900 text-white border-none shadow-md z-50">
          <p className="text-sm font-medium">{message}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
