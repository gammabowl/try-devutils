import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileKey as FileKeyIcon, AlertCircle, CheckCircle, Copy, Shield, Clock, ChevronDown, Maximize2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// JWT Registered Claims as per RFC 7519
const REGISTERED_CLAIMS: Record<string, { description: string; link: string }> = {
  iss: { description: "The issuer of the JWT", link: "https://datatracker.ietf.org/doc/html/rfc7519#section-4.1.1" },
  sub: { description: "The subject of the JWT (the user)", link: "https://datatracker.ietf.org/doc/html/rfc7519#section-4.1.2" },
  aud: { description: "The intended recipients of the JWT", link: "https://datatracker.ietf.org/doc/html/rfc7519#section-4.1.3" },
  exp: { description: "The expiration time after which the JWT must not be accepted", link: "https://datatracker.ietf.org/doc/html/rfc7519#section-4.1.4" },
  nbf: { description: "The time before which the JWT must not be accepted", link: "https://datatracker.ietf.org/doc/html/rfc7519#section-4.1.5" },
  iat: { description: "The time at which the JWT was issued", link: "https://datatracker.ietf.org/doc/html/rfc7519#section-4.1.6" },
  jti: { description: "A unique identifier for the JWT", link: "https://datatracker.ietf.org/doc/html/rfc7519#section-4.1.7" }
};

// JWT Header Parameters as per RFC 7515 (JWS) and RFC 7516 (JWE)
const HEADER_CLAIMS: Record<string, { description: string; link: string }> = {
  alg: { description: "The algorithm used to sign or encrypt the JWT", link: "https://datatracker.ietf.org/doc/html/rfc7515#section-4.1.1" },
  typ: { description: "The media type of this complete JWT", link: "https://datatracker.ietf.org/doc/html/rfc7519#section-5.1" },
  cty: { description: "The content type of the JWT payload", link: "https://datatracker.ietf.org/doc/html/rfc7515#section-4.1.10" },
  kid: { description: "A hint indicating which key was used to sign the JWT", link: "https://datatracker.ietf.org/doc/html/rfc7515#section-4.1.4" },
  jku: { description: "A URL pointing to a set of JSON-encoded public keys", link: "https://datatracker.ietf.org/doc/html/rfc7515#section-4.1.2" },
  jwk: { description: "The public key used to sign the JWT", link: "https://datatracker.ietf.org/doc/html/rfc7515#section-4.1.3" },
  x5u: { description: "A URL pointing to an X.509 certificate", link: "https://datatracker.ietf.org/doc/html/rfc7515#section-4.1.5" },
  x5c: { description: "The X.509 certificate chain for the signing key", link: "https://datatracker.ietf.org/doc/html/rfc7515#section-4.1.6" },
  x5t: { description: "The SHA-1 thumbprint of the X.509 certificate", link: "https://datatracker.ietf.org/doc/html/rfc7515#section-4.1.7" },
  "x5t#S256": { description: "The SHA-256 thumbprint of the X.509 certificate", link: "https://datatracker.ietf.org/doc/html/rfc7515#section-4.1.8" }
};

// Public Claims (commonly used but not registered in RFC 7519)
const PUBLIC_CLAIMS: Record<string, { description: string; link?: string }> = {
  name: { description: "The full name of the user", link: "https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims" },
  given_name: { description: "The first name of the user", link: "https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims" },
  family_name: { description: "The last name of the user", link: "https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims" },
  middle_name: { description: "The middle name of the user", link: "https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims" },
  nickname: { description: "The casual name of the user", link: "https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims" },
  preferred_username: { description: "The preferred username of the user", link: "https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims" },
  profile: { description: "URL of the user's profile page", link: "https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims" },
  picture: { description: "URL of the user's profile picture", link: "https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims" },
  website: { description: "URL of the user's website", link: "https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims" },
  email: { description: "The email address of the user", link: "https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims" },
  email_verified: { description: "Whether the user's email has been verified", link: "https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims" },
  gender: { description: "The gender of the user", link: "https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims" },
  birthdate: { description: "The birthdate of the user", link: "https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims" },
  zoneinfo: { description: "The time zone of the user", link: "https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims" },
  locale: { description: "The locale of the user", link: "https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims" },
  phone_number: { description: "The phone number of the user", link: "https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims" },
  phone_number_verified: { description: "Whether the user's phone has been verified", link: "https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims" },
  address: { description: "The mailing address of the user", link: "https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims" },
  updated_at: { description: "The time the user's info was last updated", link: "https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims" },
  azp: { description: "The authorized party to which the token was issued", link: "https://openid.net/specs/openid-connect-core-1_0.html#IDToken" },
  nonce: { description: "A string used to associate a session with a token", link: "https://openid.net/specs/openid-connect-core-1_0.html#IDToken" },
  auth_time: { description: "The time when the user authentication occurred", link: "https://openid.net/specs/openid-connect-core-1_0.html#IDToken" },
  at_hash: { description: "The access token hash value", link: "https://openid.net/specs/openid-connect-core-1_0.html#CodeIDToken" },
  c_hash: { description: "The authorization code hash value", link: "https://openid.net/specs/openid-connect-core-1_0.html#HybridIDToken" },
  acr: { description: "The authentication context class reference", link: "https://openid.net/specs/openid-connect-core-1_0.html#IDToken" },
  amr: { description: "The authentication methods used", link: "https://openid.net/specs/openid-connect-core-1_0.html#IDToken" },
  scope: { description: "The scopes granted to the token", link: "https://datatracker.ietf.org/doc/html/rfc6749#section-3.3" },
  sid: { description: "An identifier for the user's session", link: "https://openid.net/specs/openid-connect-frontchannel-1_0.html" },
  roles: { description: "The roles assigned to the user" },
  groups: { description: "The groups the user belongs to" },
  permissions: { description: "The permissions granted to the user" },
  admin: { description: "Whether the user is an administrator" }
};

interface ClaimInfo {
  claim: string;
  value: string;
  description: string;
  link?: string;
}

function getClaimInfo(claim: string, isHeader: boolean = false): { description: string; link?: string } {
  // Check header claims first if it's a header
  if (isHeader && HEADER_CLAIMS[claim]) {
    return {
      description: HEADER_CLAIMS[claim].description,
      link: HEADER_CLAIMS[claim].link
    };
  }
  
  if (REGISTERED_CLAIMS[claim]) {
    return {
      description: REGISTERED_CLAIMS[claim].description,
      link: REGISTERED_CLAIMS[claim].link
    };
  }
  
  if (PUBLIC_CLAIMS[claim]) {
    return {
      description: PUBLIC_CLAIMS[claim].description,
      link: PUBLIC_CLAIMS[claim].link
    };
  }
  
  // Also check header claims as fallback (for cases like typ appearing in payload)
  if (HEADER_CLAIMS[claim]) {
    return {
      description: HEADER_CLAIMS[claim].description,
      link: HEADER_CLAIMS[claim].link
    };
  }
  
  // Custom claim - no description
  return {
    description: ""
  };
}

interface DecodedToken {
  header: any;
  payload: any;
  signature: string;
  isValid: boolean;
}

interface JwtDecoderProps {
  initialContent?: string;
  action?: string;
}

export function JwtDecoder({ initialContent, action }: JwtDecoderProps) {
  // Sample JWT token for new users
  const sampleToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
  
  const [token, setToken] = useState(initialContent || sampleToken);
  const [decoded, setDecoded] = useState<DecodedToken | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("decoder");
  const [headerInput, setHeaderInput] = useState('{\n  "alg": "HS256",\n  "typ": "JWT"\n}');
  const [payloadInput, setPayloadInput] = useState('{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": 1516239022\n}');
  const [secret, setSecret] = useState("your-256-bit-secret");
  const [signatureVerified, setSignatureVerified] = useState<boolean | null>(null);
  const [headerExpanded, setHeaderExpanded] = useState(true);
  const [payloadExpanded, setPayloadExpanded] = useState(true);
  const [maximizedView, setMaximizedView] = useState<{ type: 'header-json' | 'header-claims' | 'payload-json' | 'payload-claims'; title: string } | null>(null);
  const { toast } = useToast();

  // Load initial token and handle auto-decode
  useEffect(() => {
    if (initialContent && action === "decode") {
      decodeJWT(initialContent);
    } else {
      setTimeout(() => decodeJWT(token), 0);
    }
  }, [initialContent, action]);

  const decodeJWT = (token: string) => {
    try {
      setError("");
      
      if (!token.trim()) {
        setDecoded(null);
        return;
      }

      const parts = token.split(".");
      
      if (parts.length !== 3) {
        throw new Error("Invalid JWT format. JWT must have 3 parts separated by dots.");
      }

      const [headerB64, payloadB64, signature] = parts;

      // Decode base64url - Fixed padding logic
      const base64UrlDecode = (str: string) => {
        // Replace base64url chars with base64 chars
        str = str.replace(/-/g, "+").replace(/_/g, "/");
        
        // Add padding if needed
        const pad = str.length % 4;
        if (pad) {
          if (pad === 1) {
            throw new Error("Invalid base64url string");
          }
          str += new Array(5 - pad).join("=");
        }
        
        return JSON.parse(atob(str));
      };

      const header = base64UrlDecode(headerB64);
      const payload = base64UrlDecode(payloadB64);

      // Basic validation
      const now = Math.floor(Date.now() / 1000);
      let isValid = true;

      if (payload.exp && payload.exp < now) {
        isValid = false;
      }

      if (payload.nbf && payload.nbf > now) {
        isValid = false;
      }

      setDecoded({
        header,
        payload,
        signature,
        isValid,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to decode JWT");
      setDecoded(null);
    }
  };

  const formatJson = (obj: any) => {
    return JSON.stringify(obj, null, 2);
  };

  const renderJsonWithSelectableValues = (obj: any, isHeader: boolean = false) => {
    const handleValueDoubleClick = (e: React.MouseEvent<HTMLSpanElement>) => {
      e.stopPropagation();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(e.currentTarget);
      selection?.removeAllRanges();
      selection?.addRange(range);
    };

    // Timestamp fields that should show human-readable time on hover
    const TIMESTAMP_FIELDS = ['exp', 'iat', 'nbf', 'auth_time', 'updated_at'];

    const formatTimestamp = (timestamp: number): string => {
      try {
        const date = new Date(timestamp * 1000);
        return date.toLocaleString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZoneName: 'short'
        });
      } catch {
        return 'Invalid timestamp';
      }
    };

    const renderKey = (key: string): React.ReactNode => {
      const info = getClaimInfo(key, isHeader);
      const isCustomClaim = !info.description || info.description.length === 0;
      
      return (
        <TooltipProvider delayDuration={300} skipDelayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-foreground cursor-help hover:bg-muted/60 rounded px-0.5 -mx-0.5 transition-colors border-b border-dotted border-muted-foreground/40 hover:border-muted-foreground">
                "{key}"
              </span>
            </TooltipTrigger>
            <TooltipContent side="right" align="start" className="max-w-[280px] px-2 py-1.5 text-[11px] bg-popover text-popover-foreground z-[9999]" sideOffset={8}>
              <p className="font-medium text-popover-foreground">{key}</p>
              {isCustomClaim ? (
                <p className="text-popover-foreground/70 italic">Custom claim</p>
              ) : (
                <>
                  <p className="text-popover-foreground/70">{info.description}</p>
                  {info.link && (
                    <a
                      href={info.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      Learn more
                    </a>
                  )}
                </>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    };

    const renderValue = (value: any, isLast: boolean, indent: number = 2, key?: string): React.ReactNode => {
      const indentStr = "  ".repeat(indent);
      const prevIndentStr = "  ".repeat(indent - 1);
      
      // Check if this is a timestamp field
      const isTimestampField = key && TIMESTAMP_FIELDS.includes(key) && typeof value === 'number';
      
      if (value === null) {
        return (
          <>
            <span
              className="text-orange-500 cursor-text hover:bg-muted/50 rounded px-0.5"
              onDoubleClick={handleValueDoubleClick}
            >
              null
            </span>
            {!isLast && ","}
          </>
        );
      }
      if (typeof value === "boolean") {
        return (
          <>
            <span
              className="text-orange-500 cursor-text hover:bg-muted/50 rounded px-0.5"
              onDoubleClick={handleValueDoubleClick}
            >
              {value.toString()}
            </span>
            {!isLast && ","}
          </>
        );
      }
      if (typeof value === "number") {
        if (isTimestampField) {
          return (
            <>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className="text-blue-500 cursor-text hover:bg-muted/50 rounded px-0.5 border-b border-dashed border-blue-400/50"
                      onDoubleClick={handleValueDoubleClick}
                    >
                      {value}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="px-2 py-1.5 text-xs bg-popover text-popover-foreground z-[9999]" sideOffset={6}>
                    <p className="font-medium">{formatTimestamp(value)}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {!isLast && ","}
            </>
          );
        }
        return (
          <>
            <span
              className="text-blue-500 cursor-text hover:bg-muted/50 rounded px-0.5"
              onDoubleClick={handleValueDoubleClick}
            >
              {value}
            </span>
            {!isLast && ","}
          </>
        );
      }
      if (typeof value === "string") {
        return (
          <>
            <span className="text-green-600">"</span>
            <span
              className="text-green-600 cursor-text hover:bg-muted/50 rounded px-0.5"
              onDoubleClick={handleValueDoubleClick}
            >
              {value}
            </span>
            <span className="text-green-600">"</span>
            {!isLast && ","}
          </>
        );
      }
      if (Array.isArray(value)) {
        if (value.length === 0) {
          return <>[]{!isLast && ","}</>;
        }
        return (
          <>
            [{"\n"}
            {value.map((item, i) => (
              <span key={i}>
                {indentStr}{renderValue(item, i === value.length - 1, indent + 1)}{"\n"}
              </span>
            ))}
            {prevIndentStr}]{!isLast && ","}
          </>
        );
      }
      if (typeof value === "object") {
        const nestedEntries = Object.entries(value);
        if (nestedEntries.length === 0) {
          return <>{"{}"}{!isLast && ","}</>;
        }
        return (
          <>
            {"{"}{"\n"}
            {nestedEntries.map(([nestedKey, nestedValue], nestedIndex) => (
              <span key={nestedKey}>
                {indentStr}<span className="text-foreground">"{nestedKey}"</span>: {renderValue(nestedValue, nestedIndex === nestedEntries.length - 1, indent + 1)}{"\n"}
              </span>
            ))}
            {prevIndentStr}{"}"}{!isLast && ","}
          </>
        );
      }
      return String(value);
    };

    const entries = Object.entries(obj);
    return (
      <pre className="bg-background border border-input p-4 rounded text-sm whitespace-pre-wrap break-all leading-relaxed">
        {"{"}{"\n"}
        {entries.map(([key, value], index) => (
          <span key={key}>
            {"  "}{renderKey(key)}: {renderValue(value, index === entries.length - 1, 2, key)}{"\n"}
          </span>
        ))}
        {"}"}
      </pre>
    );
  };

  const getExpirationStatus = () => {
    if (!decoded?.payload?.exp) return null;
    
    const exp = decoded.payload.exp;
    const now = Math.floor(Date.now() / 1000);
    
    if (exp < now) {
      return { status: "expired" as const, message: "Token has expired" };
    }
    
    const timeLeft = exp - now;
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    
    return {
      status: "valid" as const,
      message: `Expires in ${hours}h ${minutes}m`,
    };
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ description: "Copied to clipboard!" });
  };

  const loadSampleToken = () => {
    setToken(sampleToken);
    decodeJWT(sampleToken);
  };

  const formatClaims = (obj: any, isHeader: boolean = false): ClaimInfo[] => {
    const TIMESTAMP_FIELDS = ['exp', 'iat', 'nbf', 'auth_time', 'updated_at'];
    
    const formatTimestamp = (timestamp: number): string => {
      try {
        const date = new Date(timestamp * 1000);
        return date.toLocaleString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZoneName: 'short'
        });
      } catch {
        return 'Invalid timestamp';
      }
    };
    
    return Object.entries(obj).map(([key, value]) => {
      const info = getClaimInfo(key, isHeader);
      
      let displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      
      // Add formatted timestamp for timestamp fields
      if (TIMESTAMP_FIELDS.includes(key) && typeof value === 'number') {
        displayValue = `${value} (${formatTimestamp(value)})`;
      }
      
      return {
        claim: key,
        value: displayValue,
        description: info.description,
        link: info.link
      };
    });
  };

  const getPayloadHeight = () => {
    if (!decoded?.payload) return "max-h-32";
    const payloadJson = formatJson(decoded.payload);
    const lines = payloadJson.split('\n').length;
    const claimsCount = Object.keys(decoded.payload).length;
    
    // For claims table: each claim takes ~2 lines, header takes 1 line
    // Calculate based on total content size
    const estimatedHeight = Math.min(claimsCount * 8 + 40, 500);
    
    if (estimatedHeight < 100) return "max-h-32";
    if (estimatedHeight < 200) return "max-h-48";
    if (estimatedHeight < 300) return "max-h-64";
    if (estimatedHeight < 400) return "max-h-80";
    return "max-h-screen";
  };

  const encodeJWT = () => {
    try {
      const header = JSON.parse(headerInput);
      const payload = JSON.parse(payloadInput);
      
      const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      
      // Create signature placeholder (in real implementation, this would use the actual algorithm)
      const signature = btoa(`${encodedHeader}.${encodedPayload}.${secret}`).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_').substring(0, 43);
      
      const encodedToken = `${encodedHeader}.${encodedPayload}.${signature}`;
      setToken(encodedToken);
      decodeJWT(encodedToken);
      setActiveTab("decoder");
      toast({ description: "JWT encoded successfully!" });
    } catch (err) {
      toast({ description: "Invalid JSON in header or payload", variant: "destructive" });
    }
  };

  const getTokenParts = () => {
    if (!token) return { header: "", payload: "", signature: "" };
    const parts = token.split(".");
    return {
      header: parts[0] || "",
      payload: parts[1] || "",
      signature: parts[2] || "",
    };
  };

  const expStatus = getExpirationStatus();
  const tokenParts = getTokenParts();

  return (
    <Card className="tool-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <FileKeyIcon className="h-5 w-5 text-dev-primary" />
          JWT Token
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="decoder" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="decoder">Decoder</TabsTrigger>
            <TabsTrigger value="encoder">Encoder</TabsTrigger>
          </TabsList>

          {/* Encoder Tab */}
          <TabsContent value="encoder" className="space-y-4 pt-4">
            <div className="grid lg:grid-cols-2 gap-6 min-h-[540px] items-stretch">
              {/* Left Side - Input Fields */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-foreground">Create JWT</h3>
                
                {/* Header */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    HEADER: ALGORITHM & TOKEN TYPE
                  </h4>
                  <Textarea
                    value={headerInput}
                    onChange={(e) => setHeaderInput(e.target.value)}
                    className="w-full sm:max-w-[720px] min-h-[120px] font-mono text-sm bg-background border-2 border-input focus:border-ring"
                  />
                </div>

                {/* Payload */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded"></div>
                    PAYLOAD: DATA
                  </h4>
                  <Textarea
                    value={payloadInput}
                    onChange={(e) => setPayloadInput(e.target.value)}
                    className="w-full sm:max-w-[720px] min-h-[120px] font-mono text-sm bg-background border-2 border-input focus:border-ring"
                  />
                </div>

                {/* Secret */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <div className="w-3 h-3 bg-cyan-500 rounded"></div>
                    SIGN JWT: SECRET
                  </h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={secret}
                      onChange={(e) => setSecret(e.target.value)}
                      className="w-full sm:max-w-[520px] px-3 py-2 text-sm bg-background border-2 border-input focus:border-ring rounded-md font-mono"
                      placeholder="Enter your secret"
                    />
                    <Button onClick={encodeJWT} className="bg-dev-primary hover:bg-dev-primary/80 text-dev-primary-foreground px-6">
                      Encode
                    </Button>
                  </div>
                </div>
              </div>

              {/* Right Side - Generated JWT */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">JSON WEB TOKEN</h3>
                  {token && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(token)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  )}
                </div>
                
                <div className="space-y-3">
                  <Textarea
                    value={token}
                    readOnly
                    className="w-full sm:max-w-[720px] h-[460px] font-mono text-sm bg-background border-2 border-input resize-none"
                    placeholder="Your encoded JWT will appear here..."
                  />
                </div>

                {/* Color-coded token parts preview */}
                {token && token.split(".").length === 3 && (
                  <div className="p-4 bg-muted/20 rounded-lg border border-border/50">
                    <div className="text-sm text-muted-foreground mb-2">Token Structure:</div>
                    <div className="font-mono text-sm break-all">
                      <span className="text-red-500 bg-red-500/10 px-1 rounded">
                        {tokenParts.header}
                      </span>
                      <span className="text-muted-foreground">.</span>
                      <span className="text-purple-500 bg-purple-500/10 px-1 rounded">
                        {tokenParts.payload}
                      </span>
                      <span className="text-muted-foreground">.</span>
                      <span className="text-cyan-500 bg-cyan-500/10 px-1 rounded">
                        {tokenParts.signature}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Decoder Tab */}
          <TabsContent value="decoder" className="space-y-4 pt-4">
            <div className="grid lg:grid-cols-2 gap-6 min-h-[540px] items-stretch">
            {/* Left Side - JWT Input */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">ENCODED VALUE</h3>
                {decoded && (
                  <div className="flex items-center gap-2">
                    {decoded.isValid ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Valid JWT
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Invalid/Expired
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">JWT Token</label>
                  <div className="flex gap-2">
                    {token && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(token)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setToken("");
                        setDecoded(null);
                        setError("");
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
                <Textarea
                  placeholder="Paste your JWT token here..."
                  value={token}
                  onChange={(e) => {
                    setToken(e.target.value);
                    decodeJWT(e.target.value);
                  }}
                  className="w-full sm:max-w-[720px] h-[460px] font-mono text-sm bg-background border-2 border-input focus:border-ring resize-none"
                />
              </div>

              {/* Color-coded token parts preview */}
              {token && token.split(".").length === 3 && (
                <div className="p-4 bg-muted/20 rounded-lg border border-border/50">
                  <div className="text-sm text-muted-foreground mb-2">Token Structure:</div>
                  <div className="font-mono text-sm break-all">
                    <span className="text-red-500 bg-red-500/10 px-1 rounded">
                      {tokenParts.header}
                    </span>
                    <span className="text-muted-foreground">.</span>
                    <span className="text-purple-500 bg-purple-500/10 px-1 rounded">
                      {tokenParts.payload}
                    </span>
                    <span className="text-muted-foreground">.</span>
                    <span className="text-cyan-500 bg-cyan-500/10 px-1 rounded">
                      {tokenParts.signature}
                    </span>
                  </div>
                </div>
              )}

              {expStatus && (
                <Badge variant={expStatus.status === "expired" ? "destructive" : "secondary"} className="w-full justify-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {expStatus.message}
                </Badge>
              )}
            </div>

            {/* Right Side - Decoded Sections */}
            {decoded && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Decoded JWT</h3>
                
                <div className="space-y-4">
                  {/* Header */}
                  <Collapsible open={headerExpanded} onOpenChange={setHeaderExpanded}>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <CollapsibleTrigger asChild>
                          <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${headerExpanded ? '' : '-rotate-90'}`} />
                            <div className="w-3 h-3 bg-red-500 rounded"></div>
                            <h4 className="text-sm font-semibold">DECODED HEADER</h4>
                          </button>
                        </CollapsibleTrigger>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(formatJson(decoded.header))}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                      
                      <CollapsibleContent>
                        <Tabs defaultValue="json" className="w-full">
                          <TabsList className="grid w-full grid-cols-2 h-9">
                            <TabsTrigger value="json" className="text-xs py-1">JSON</TabsTrigger>
                            <TabsTrigger value="claims" className="text-xs py-1">CLAIMS TABLE</TabsTrigger>
                          </TabsList>
                          <TabsContent value="json" className="mt-2">
                            <div className="relative">
                              <button
                                onClick={() => setMaximizedView({ type: 'header-json', title: 'Header JSON' })}
                                className="absolute top-2 right-2 p-1 hover:bg-muted rounded transition-colors z-10"
                                title="Maximize"
                              >
                                <Maximize2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                              </button>
                              {renderJsonWithSelectableValues(decoded.header, true)}
                            </div>
                          </TabsContent>
                          <TabsContent value="claims" className="mt-2">
                            <div className="relative">
                              <button
                                onClick={() => setMaximizedView({ type: 'header-claims', title: 'Header Claims' })}
                                className="absolute top-2 right-2 p-1 hover:bg-muted rounded transition-colors z-10 bg-background/80"
                                title="Maximize"
                              >
                                <Maximize2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                              </button>
                              <div className="bg-background border border-input rounded overflow-hidden">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-border bg-muted/50">
                                    <th className="text-left p-2 font-semibold text-red-600 w-[80px] border-r border-border/50">CLAIM</th>
                                    <th className="text-left p-2 font-semibold text-foreground border-r border-border/50">VALUE</th>
                                    <th className="text-left p-2 font-semibold text-muted-foreground">DESCRIPTION</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-red-500/20">
                                  {formatClaims(decoded.header, true).map((claim, index) => (
                                    <tr key={index}>
                                      <td className="p-2 font-mono text-red-600 align-top border-r border-border/50">{claim.claim}</td>
                                      <td className={`p-2 font-mono text-foreground break-all align-top ${claim.description ? 'border-r border-border/50' : ''}`} colSpan={claim.description ? 1 : 2}>
                                        <div className="flex items-start gap-1 group">
                                          <span className="flex-1">{claim.value}</span>
                                          <button
                                            onClick={() => copyToClipboard(claim.value)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-muted rounded flex-shrink-0"
                                            title="Copy value"
                                          >
                                            <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                          </button>
                                        </div>
                                      </td>
                                      {claim.description && (
                                        <td className="p-2 text-muted-foreground align-top">
                                          {claim.description}
                                          {claim.link && (
                                            <>
                                              {" "}
                                              <a
                                                href={claim.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-500 hover:text-blue-600 underline"
                                              >
                                                Learn more
                                              </a>
                                            </>
                                          )}
                                        </td>
                                      )}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>

                  {/* Payload */}
                  <Collapsible open={payloadExpanded} onOpenChange={setPayloadExpanded}>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <CollapsibleTrigger asChild>
                          <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${payloadExpanded ? '' : '-rotate-90'}`} />
                            <div className="w-3 h-3 bg-purple-500 rounded"></div>
                            <h4 className="text-sm font-semibold">DECODED PAYLOAD</h4>
                          </button>
                        </CollapsibleTrigger>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(formatJson(decoded.payload))}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                      
                      <CollapsibleContent>
                        <Tabs defaultValue="json" className="w-full">
                          <TabsList className="grid w-full grid-cols-2 h-9">
                            <TabsTrigger value="json" className="text-xs py-1">JSON</TabsTrigger>
                            <TabsTrigger value="claims" className="text-xs py-1">CLAIMS TABLE</TabsTrigger>
                          </TabsList>

                          <TabsContent value="json" className="mt-2">
                            <div className="relative">
                              <button
                                onClick={() => setMaximizedView({ type: 'payload-json', title: 'Payload JSON' })}
                                className="absolute top-2 right-2 p-1 hover:bg-muted rounded transition-colors z-10"
                                title="Maximize"
                              >
                                <Maximize2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                              </button>
                              {renderJsonWithSelectableValues(decoded.payload, false)}
                            </div>
                          </TabsContent>

                          <TabsContent value="claims" className="mt-2">
                            <div className="relative">
                              <button
                                onClick={() => setMaximizedView({ type: 'payload-claims', title: 'Payload Claims' })}
                                className="absolute top-2 right-2 p-1 hover:bg-muted rounded transition-colors z-10 bg-background/80"
                                title="Maximize"
                              >
                                <Maximize2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                              </button>
                              <div className="bg-background border border-input rounded overflow-hidden">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-border bg-muted/50">
                                    <th className="text-left p-2 font-semibold text-purple-600 w-[80px] border-r border-border/50">CLAIM</th>
                                    <th className="text-left p-2 font-semibold text-foreground border-r border-border/50">VALUE</th>
                                    <th className="text-left p-2 font-semibold text-muted-foreground">DESCRIPTION</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-purple-500/20">
                                  {formatClaims(decoded.payload, false).map((claim, index) => (
                                    <tr key={index}>
                                      <td className="p-2 font-mono text-purple-600 align-top border-r border-border/50">{claim.claim}</td>
                                      <td className={`p-2 font-mono text-foreground break-all align-top ${claim.description ? 'border-r border-border/50' : ''}`} colSpan={claim.description ? 1 : 2}>
                                        <div className="flex items-start gap-1 group">
                                          <span className="flex-1">{claim.value}</span>
                                          <button
                                            onClick={() => copyToClipboard(claim.value)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-muted rounded flex-shrink-0"
                                            title="Copy value"
                                          >
                                            <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                          </button>
                                        </div>
                                      </td>
                                      {claim.description && (
                                        <td className="p-2 text-muted-foreground align-top">
                                          {claim.description}
                                          {claim.link && (
                                            <>
                                              {" "}
                                              <a
                                                href={claim.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-500 hover:text-blue-600 underline"
                                              >
                                                Learn more
                                              </a>
                                            </>
                                          )}
                                        </td>
                                      )}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>

                  {/* Signature Verification */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <div className="w-3 h-3 bg-cyan-500 rounded"></div>
                        JWT SIGNATURE VERIFICATION
                      </h4>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={secret}
                          onChange={(e) => setSecret(e.target.value)}
                          className="flex-1 px-3 py-2 text-sm bg-cyan-500/5 border border-cyan-500/20 rounded-md font-mono"
                          placeholder="Enter secret to verify signature"
                        />
                      </div>
                      
                      <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="h-4 w-4 text-cyan-600" />
                          <span className="text-sm font-medium">Signature Status</span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Algorithm:</span>
                            <span className="font-mono">{decoded?.header?.alg || 'Unknown'}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Signature:</span>
                            <span className="font-mono text-cyan-600 truncate max-w-[200px]">
                              {decoded?.signature || 'No signature'}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Status:</span>
                            <Badge variant="secondary" className="h-5 text-sm">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Signature not verified
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-3 p-2 bg-muted/20 rounded border">
                            <strong>Note:</strong> This is a demo implementation. In production, signature verification requires the actual signing algorithm and proper key management.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            </div>
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Maximized View Dialog */}
        <Dialog open={maximizedView !== null} onOpenChange={(open) => !open && setMaximizedView(null)}>
          <DialogContent className="max-w-6xl w-[90vw] max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="flex items-center gap-2">
                {maximizedView?.type.includes('header') ? (
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                ) : (
                  <div className="w-3 h-3 bg-purple-500 rounded"></div>
                )}
                {maximizedView?.title}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-auto p-4 pt-6">
              {maximizedView?.type === 'header-json' && decoded && (
                renderJsonWithSelectableValues(decoded.header, true)
              )}
              {maximizedView?.type === 'payload-json' && decoded && (
                renderJsonWithSelectableValues(decoded.payload, false)
              )}
              {maximizedView?.type === 'header-claims' && decoded && (
                <div className="bg-background border border-input rounded overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left p-2 font-semibold text-red-600 w-[100px] border-r border-border/50">CLAIM</th>
                        <th className="text-left p-2 font-semibold text-foreground border-r border-border/50">VALUE</th>
                        <th className="text-left p-2 font-semibold text-muted-foreground">DESCRIPTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-red-500/20">
                      {formatClaims(decoded.header, true).map((claim, index) => (
                        <tr key={index}>
                          <td className="p-2 font-mono text-red-600 align-top border-r border-border/50">{claim.claim}</td>
                          <td className={`p-2 font-mono text-foreground break-all align-top ${claim.description ? 'border-r border-border/50' : ''}`} colSpan={claim.description ? 1 : 2}>
                            <div className="flex items-start gap-1 group">
                              <span className="flex-1">{claim.value}</span>
                              <button
                                onClick={() => copyToClipboard(claim.value)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-muted rounded flex-shrink-0"
                                title="Copy value"
                              >
                                <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                              </button>
                            </div>
                          </td>
                          {claim.description && (
                            <td className="p-2 text-muted-foreground align-top">
                              {claim.description}
                              {claim.link && (
                                <>
                                  {" "}
                                  <a
                                    href={claim.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:text-blue-600 underline"
                                  >
                                    Learn more
                                  </a>
                                </>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {maximizedView?.type === 'payload-claims' && decoded && (
                <div className="bg-background border border-input rounded overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left p-2 font-semibold text-purple-600 w-[100px] border-r border-border/50">CLAIM</th>
                        <th className="text-left p-2 font-semibold text-foreground border-r border-border/50">VALUE</th>
                        <th className="text-left p-2 font-semibold text-muted-foreground">DESCRIPTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-500/20">
                      {formatClaims(decoded.payload, false).map((claim, index) => (
                        <tr key={index}>
                          <td className="p-2 font-mono text-purple-600 align-top border-r border-border/50">{claim.claim}</td>
                          <td className={`p-2 font-mono text-foreground break-all align-top ${claim.description ? 'border-r border-border/50' : ''}`} colSpan={claim.description ? 1 : 2}>
                            <div className="flex items-start gap-1 group">
                              <span className="flex-1">{claim.value}</span>
                              <button
                                onClick={() => copyToClipboard(claim.value)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-muted rounded flex-shrink-0"
                                title="Copy value"
                              >
                                <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                              </button>
                            </div>
                          </td>
                          {claim.description && (
                            <td className="p-2 text-muted-foreground align-top">
                              {claim.description}
                              {claim.link && (
                                <>
                                  {" "}
                                  <a
                                    href={claim.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:text-blue-600 underline"
                                  >
                                    Learn more
                                  </a>
                                </>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}