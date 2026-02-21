import { useEffect } from "react";

const PrivacyRedirect = () => {
  useEffect(() => {
    window.location.replace("/privacy/index.html");
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-muted-foreground">Redirecting to privacy policy…</p>
    </div>
  );
};

export default PrivacyRedirect;
