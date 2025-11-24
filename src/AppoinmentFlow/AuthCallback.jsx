import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { state } = useLocation();

  useEffect(() => {
    if (state?.token) {
      localStorage.setItem("auth_token", state.token);
      localStorage.setItem("isAuthenticated", "true");
      // Delay to ensure localStorage commits before route change
      setTimeout(() => {
        navigate("/patient-dashboard", { replace: true });
      }, 50);
    } else {
      navigate("/landing", { replace: true });
    }
  }, [navigate, state]);

  return <div>Logging you in, please wait...</div>;
}
