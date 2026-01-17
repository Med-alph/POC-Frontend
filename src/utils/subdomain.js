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

    // Handle something.localhost (length is 2)
    if (hostname.endsWith('.localhost') && parts.length >= 2) {
        return parts[0].toLowerCase();
    }

    // Handle production domains like apollo.emr.medalph.com (length >= 3)
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
    const subdomain = getSubdomain();
    return subdomain === 'superadmin';
};

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
