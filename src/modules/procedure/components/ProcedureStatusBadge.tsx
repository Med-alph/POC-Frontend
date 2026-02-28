// Procedure Status Badge Component

import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { ProcedureStatus } from '../types/procedure.types';

interface ProcedureStatusBadgeProps {
  status: ProcedureStatus;
  className?: string;
}

const statusConfig: Record<ProcedureStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'success' | 'outline' }> = {
  SCHEDULED: { label: 'Scheduled', variant: 'outline' },
  IN_PROGRESS: { label: 'In Progress', variant: 'default' },
  COMPLETED: { label: 'Completed', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
  POSTPONED: { label: 'Postponed', variant: 'secondary' },
};

export const ProcedureStatusBadge: React.FC<ProcedureStatusBadgeProps> = ({ status, className }) => {
  const config = statusConfig[status] || { label: status, variant: 'outline' };

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
};


