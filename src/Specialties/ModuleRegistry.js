import { lazy } from 'react';

export const ModuleRegistry = {
  'VACCINES': {
    name: 'Vaccines',
    component: lazy(() => import('./Pediatrics/VaccinePanel')),
    icon: 'Syringe'
  },
  'GROWTH': {
    name: 'Growth Charts',
    component: lazy(() => import('./Pediatrics/GrowthPanel')),
    icon: 'TrendingUp'
  }
};

export const getModuleComponent = (moduleName) => {
  return ModuleRegistry[moduleName] || null;
};
