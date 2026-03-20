import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { isTenantSuperAdminPortal } from "../utils/subdomain";

function isTenantSuperAdminUser(user) {
  if (!user) return false;
  const perms = user.permissions || [];
  if (perms.includes("roles:manage")) return true;
  return typeof user.role === "string" && user.role.toLowerCase() === "superadmin";
}

/**
 * Support ticket management is only available on the tenant superadmin host
 * (superadmin.&lt;tenant&gt;.*), not on the admin tenant portal.
 */
export default function TenantSuperAdminSupportGate({ children }) {
  const user = useSelector((s) => s.auth.user);

  if (!isTenantSuperAdminPortal() || !isTenantSuperAdminUser(user)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
