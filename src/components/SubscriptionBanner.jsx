import React from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { AlertCircle, Clock, CheckCircle, ArrowRight, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

const SubscriptionBanner = ({ variant = 'full' }) => {
  const { isTrial, isGrace, isExpired, daysLeft, isReadOnly, loading, status } = useSubscription();
  const user = useSelector((state) => state.auth.user);
  
  const isCompact = variant === 'compact' || variant === 'navbar';
  
  // Role Check: Only Tenant Admins or Owners can handle subscriptions
  const userRole = user?.role?.toLowerCase() || '';
  const isTenantAdmin = userRole === 'tenant_admin' || userRole === 'owner';
  const canModifySubscription = isTenantAdmin;

  // If loading or paid active status, no banner needed
  if (loading || (!isTrial && !isGrace && !isExpired)) return null;

  // Determine styles and content based on status
  let bgColor = 'bg-blue-600';
  let textColor = 'text-white';
  let icon = <Clock className="w-5 h-5 mr-2" />;
  let message = '';
  let subMessage = '';
  let actionLabel = 'Upgrade Plan';
  let actionLink = '/hospital/settings#subscription';

  if (isTrial) {
    if (daysLeft > 7) {
      bgColor = 'bg-gradient-to-r from-blue-600 to-indigo-600 border-b border-blue-400';
      message = `Your Free Trial is active. ${daysLeft} days remaining.`;
      subMessage = "Explore all features and build your workflow.";
      icon = <Clock className="w-5 h-5 mr-2 text-blue-100" />;
    } else if (daysLeft > 0) {
      bgColor = 'bg-gradient-to-r from-orange-500 to-amber-600 border-b border-orange-400';
      message = `Your Trial expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`;
      subMessage = "Upgrade now to ensure uninterrupted clinical operations.";
      icon = <AlertCircle className="w-5 h-5 mr-2 text-white" />;
    }
  } else if (isGrace) {
    bgColor = 'bg-gradient-to-r from-red-500 to-rose-600 border-b border-red-400 animate-pulse';
    message = 'Trial Expired! You are currently in a 48-hour grace period.';
    subMessage = 'Upgrade now to prevent your account from becoming Read-Only.';
    icon = <AlertCircle className="w-5 h-5 mr-2 text-white" />;
    actionLabel = 'Fast Checkout';
  } else if (isExpired || isReadOnly) {
    bgColor = 'bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700';
    message = 'Read-Only Mode Active.';
    subMessage = 'Your data is safe and accessible, but editing is disabled. Upgrade to reactivate.';
    icon = <AlertCircle className="w-5 h-5 mr-2 text-red-500" />;
    actionLabel = 'Reactivate Account';
  }

  if (isCompact) {
    let theme = "bg-blue-50 text-blue-700 border-blue-100";
    let iconColor = "text-blue-600";
    let btnColor = "bg-blue-600";

    if (isTrial && daysLeft <= 7) {
      theme = "bg-orange-50 text-orange-700 border-orange-100";
      iconColor = "text-orange-600";
      btnColor = "bg-orange-600";
    }
    if (isGrace) {
      theme = "bg-red-50 text-red-700 border-red-100 animate-pulse";
      iconColor = "text-red-600";
      btnColor = "bg-red-600";
    }
    if (isExpired || isReadOnly) {
      theme = "bg-gray-100 text-gray-700 border-gray-200";
      iconColor = "text-gray-600";
      btnColor = "bg-gray-800";
    }

    if (variant === 'navbar') {
      return (
        <div className={`flex flex-1 mx-2 md:mx-6 items-center justify-between ${theme} border border-opacity-50 rounded-lg px-3 md:px-4 py-1.5 md:py-2 shadow-sm animate-in fade-in slide-in-from-top-2 duration-500 overflow-hidden`}>
          <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
            {React.cloneElement(icon, { className: `w-3.5 h-3.5 md:w-4 md:h-4 shrink-0 ${iconColor}` })}
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2 overflow-hidden">
              <span className="text-[10px] md:text-xs font-bold leading-none truncate">
                {isTrial ? `${daysLeft}d Trial Left` : isGrace ? 'Trial Expired (Grace)' : 'Read-Only Mode'}
              </span>
              <span className="text-[9px] md:text-[10px] opacity-75 hidden xl:inline truncate">
                {!canModifySubscription ? 'Please contact your administrator to upgrade' : subMessage}
              </span>
            </div>
          </div>
          {canModifySubscription ? (
            <Link 
              to={actionLink}
              className={`${btnColor} text-white px-2.5 md:px-3 py-1 rounded-md text-[9px] md:text-[10px] font-bold hover:brightness-110 transition-all shadow-sm shrink-0 flex items-center gap-1 group`}
            >
              <span className="hidden sm:inline">{actionLabel}</span>
              <span className="sm:hidden">Pay</span>
              <ArrowRight className="w-2.5 h-2.5 md:w-3 md:h-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-md shrink-0">
               {/* <ShieldAlert className="w-3 h-3 text-white/70" />
               <span className="text-[9px] font-bold text-white/90 uppercase tracking-tighter">Staff View</span> */}
            </div>
          )}
        </div>
      );
    }

    // Default compact pill for mobile or small spaces
    return (
      <div className={`flex items-center gap-2 ${theme} border rounded-full px-3 py-1 shadow-sm`}>
        <div className="flex items-center gap-1.5">
          {React.cloneElement(icon, { className: `w-3.5 h-3.5 shrink-0 ${iconColor}` })}
          <span className="text-[10px] sm:text-xs font-bold whitespace-nowrap">
            {isTrial ? `${daysLeft}d left` : isGrace ? 'Trial Expired' : 'Read Only'}
            {!canModifySubscription && <span className="ml-1 opacity-60">(Contact Admin)</span>}
          </span>
        </div>
        {canModifySubscription && (
          <Link 
            to={actionLink}
            className={`${btnColor} text-white px-2 py-0.5 rounded-full text-[9px] sm:text-xs font-bold hover:brightness-110 transition-all shadow-sm ml-1`}
          >
            {actionLabel === 'Upgrade Plan' || actionLabel === 'Reactivate Account' ? 'Upgrade' : 'Action'}
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className={`${bgColor} ${textColor} px-4 py-3 shadow-lg flex flex-col md:flex-row items-center justify-between transition-all duration-300 z-[100]`}>
      <div className="flex items-center mb-2 md:mb-0">
        <div className="flex items-center">
          {icon}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm md:text-base">{message}</span>
            </div>
            <span className="hidden md:inline ml-2 text-sm opacity-90">{subMessage}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {canModifySubscription ? (
          <Link 
            to={actionLink}
            className="bg-white text-gray-900 px-4 py-1.5 rounded-full text-xs md:text-sm font-bold hover:bg-gray-100 transition-colors shadow-sm flex items-center group"
          >
            {actionLabel}
            <ArrowRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        ) : (
          <div className="flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full cursor-default">
             <ShieldAlert className="w-4 h-4 text-white/80" />
             <span className="text-xs font-bold">Contact Admin to Upgrade</span>
          </div>
        )}
        
        {isReadOnly && (
           <Link 
           to="/export-data"
           className="text-white underline text-xs font-medium opacity-80 hover:opacity-100"
         >
           Export My Data
         </Link>
        )}
      </div>
    </div>
  );
};

export default SubscriptionBanner;
