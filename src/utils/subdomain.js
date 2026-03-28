/**
 * Utility for handling subdomains in the multi-tenant architecture.
 */

export const getSubdomain = () => {
    const hostname = window.location.hostname;

    // Handle naked localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return null;
    }

    const parts = hostname.split('.');

    // For localhost development, we often use nested subdomains like:
    // superadmin.tenant.localhost
    if (hostname.endsWith('.localhost')) {
        // Find if superadmin or admin exists in the parts
        if (parts.includes('superadmin')) return 'superadmin';
        if (parts.includes('admin')) return 'admin';

        // Default to first part if it's not just localhost
        return parts[0].toLowerCase();
    }

    // Production: handle production domains (e.g., apollo.emr.medalph.com)
    // Always treat the first part as the subdomain for production patterns
    if (parts.length >= 3) {
        return parts[0].toLowerCase();
    }

    return null;
};

export const isTenantAdmin = () => {
    const subdomain = getSubdomain();
    return subdomain === 'admin';
};

export const isAppAdmin = () => {
    const hostname = window.location.hostname.toLowerCase();
    // Match superadmin.medalph-hospital.localhost or superadmin.medalph.com
    return hostname.startsWith('superadmin.') || hostname.includes('.superadmin.');
};

/**
 * Tenant-level superadmin portal host (support tickets, etc.).
 * Not the Medalph platform admin (plans / tenant onboarding).
 *
 * Local: superadmin.<tenant>.localhost (platform uses superadmin.localhost).
 * Prod: superadmin.<tenant>.<domain>.<tld> (≥4 labels); superadmin.<domain>.<tld> stays platform (3 labels).
 */
export const isTenantSuperAdminPortal = () => {
    const hostname = window.location.hostname.toLowerCase();
    if (hostname === 'localhost' || hostname === '127.0.0.1') return false;
    const parts = hostname.split('.');

    if (parts[0] !== 'superadmin') return false;

    if (hostname.endsWith('.localhost')) {
        return parts.length >= 3;
    }

    // Production:
    // Platform admin: superadmin.medalph.com (3 labels) OR superadmin.frontend-emr.medalph.com (4 labels)
    // Tenant admin portal: superadmin.tenant.medalph.com (4 labels) OR superadmin.tenant.frontend-emr.medalph.com (5 labels)
    
    // We check if it's the special platform subdomain 'frontend-emr'
    if (parts.length === 4 && parts[1] === 'frontend-emr') {
        return false;
    }

    return parts.length >= 4;
};

/** Medalph platform admin only (excludes tenant superadmin portal on superadmin.* hosts). */
export const isPlatformAppAdmin = () => isAppAdmin() && !isTenantSuperAdminPortal();

export const isHospitalSubdomain = () => {
    const subdomain = getSubdomain();
    return subdomain !== null && subdomain !== 'admin' && subdomain !== 'superadmin' && subdomain !== 'www';
};

export const getHospitalSubdomain = () => {
    if (isHospitalSubdomain()) {
        return getSubdomain();
    }
    return null;
};
