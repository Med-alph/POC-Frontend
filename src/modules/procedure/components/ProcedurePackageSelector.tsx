// Procedure Package Selector Component

import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { procedureAPI } from '../services/procedure.api';
import type { ProcedurePackage } from '../types/procedure.types';
import { Loader2 } from 'lucide-react';

interface ProcedurePackageSelectorProps {
  value?: string;
  onChange: (packageId: string | null, pkg?: ProcedurePackage) => void;
  className?: string;
}

export const ProcedurePackageSelector: React.FC<ProcedurePackageSelectorProps> = ({
  value,
  onChange,
  className,
}) => {
  const [packages, setPackages] = useState<ProcedurePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<ProcedurePackage | null>(null);

  useEffect(() => {
    loadPackages();
  }, []);

  useEffect(() => {
    if (value && packages.length > 0) {
      const pkg = packages.find(p => p.id === value);
      setSelectedPackage(pkg || null);
    } else {
      setSelectedPackage(null);
    }
  }, [value, packages]);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const data = await procedureAPI.getPackages();
      setPackages(data.filter(p => p.isActive));
    } catch (error) {
      console.error('Failed to load packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (packageId: string) => {
    const pkg = packages.find(p => p.id === packageId);
    setSelectedPackage(pkg || null);
    onChange(packageId === 'none' ? null : packageId, pkg || undefined);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className={className}>
      <Select value={value || 'none'} onValueChange={handleChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select a package (optional)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No Package</SelectItem>
          {packages.map((pkg) => (
            <SelectItem key={pkg.id} value={pkg.id}>
              {pkg.name} {pkg.discount && `(${pkg.discount}% off)`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedPackage && (
        <Card className="mt-4 border-blue-200 bg-blue-50 dark:bg-blue-900/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{selectedPackage.name}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {selectedPackage.description && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                {selectedPackage.description}
              </p>
            )}
            <div className="flex gap-4 text-xs">
              <span className="font-semibold">Sessions: {selectedPackage.totalSessions}</span>
              <span className="font-semibold">Price: ₹{selectedPackage.price}</span>
              {selectedPackage.discount && (
                <span className="text-green-600 dark:text-green-400">
                  Discount: {selectedPackage.discount}%
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};


