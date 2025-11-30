import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KeyRound, AlertCircle, CheckCircle, Copy, Shield, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [isEncoding, setIsEncoding] = useState(false);
  const [headerInput, setHeaderInput] = useState('{\n  "alg": "HS256",\n  "typ": "JWT"\n}');
  const [payloadInput, setPayloadInput] = useState('{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": 1516239022\n}');
  const [secret, setSecret] = useState("your-256-bit-secret");
  const [signatureVerified, setSignatureVerified] = useState<boolean | null>(null);
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

  const formatClaims = (obj: any) => {
    return Object.entries(obj).map(([key, value]) => ({
      claim: key,
      value: typeof value === 'object' ? JSON.stringify(value) : String(value),
      description: getClaimDescription(key)
    }));
  };

  const getClaimDescription = (claim: string) => {
    const descriptions: { [key: string]: string } = {
      iss: "Issuer - identifies the principal that issued the JWT",
      sub: "Subject - identifies the principal that is the subject of the JWT",
      aud: "Audience - identifies the recipients that the JWT is intended for",
      exp: "Expiration Time - identifies the expiration time on or after which the JWT MUST NOT be accepted",
      nbf: "Not Before - identifies the time before which the JWT MUST NOT be accepted",
      iat: "Issued At - identifies the time at which the JWT was issued",
      jti: "JWT ID - provides a unique identifier for the JWT",
      alg: "Algorithm - identifies the cryptographic algorithm used to secure the JWS",
      typ: "Type - declares the media type of this complete JWT",
      name: "Name - full name of the user",
      email: "Email - email address of the user",
      role: "Role - role or permission level of the user"
    };
    return descriptions[claim] || "Custom claim";
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
      setIsEncoding(false);
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
          <KeyRound className="h-5 w-5 text-dev-primary" />
          JWT Token {isEncoding ? 'Encoder' : 'Decoder'}
        </CardTitle>
        <div className="flex gap-2 mt-4">
          <Button
            variant={!isEncoding ? "default" : "outline"}
            onClick={() => setIsEncoding(false)}
            size="sm"
          >
            Decoder
          </Button>
          <Button
            variant={isEncoding ? "default" : "outline"}
            onClick={() => setIsEncoding(true)}
            size="sm"
          >
            Encoder
          </Button>
          <Button
            variant="outline"
            onClick={loadSampleToken}
            size="sm"
            className="ml-auto"
          >
            Load Sample
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Encoder Section */}
        {isEncoding ? (
          <div className="grid lg:grid-cols-2 gap-6 min-h-[540px]">
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
                  <div className="text-xs text-muted-foreground mb-2">Token Structure:</div>
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
        ) : (
          /* Decoder Section */
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
                  <div className="text-xs text-muted-foreground mb-2">Token Structure:</div>
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
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded"></div>
                        DECODED HEADER
                      </h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(formatJson(decoded.header))}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                    
                    <Tabs defaultValue="json" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 h-9">
                        <TabsTrigger value="json" className="text-xs py-1">JSON</TabsTrigger>
                        <TabsTrigger value="claims" className="text-xs py-1">CLAIMS TABLE</TabsTrigger>
                      </TabsList>
                      <TabsContent value="json" className="mt-2">
                        <pre className="bg-background border border-input p-2 rounded text-xs overflow-auto max-h-32">
                          {formatJson(decoded.header)}
                        </pre>
                      </TabsContent>
                      <TabsContent value="claims" className="mt-2">
                        <div className="bg-background border border-input rounded overflow-hidden">
                          <div className="grid grid-cols-3 gap-2 p-2 font-semibold text-xs border-b border-border bg-muted/50">
                            <div className="text-red-600">CLAIM</div>
                            <div className="text-foreground">VALUE</div>
                            <div className="text-muted-foreground text-right pr-2">DESC</div>
                          </div>
                          <div className="divide-y divide-red-500/20 max-h-32 overflow-y-auto">
                            {formatClaims(decoded.header).map((claim, index) => (
                              <div key={index} className="grid grid-cols-3 gap-2 p-2 text-xs">
                                <div className="font-mono text-red-600 truncate">{claim.claim}</div>
                                <div className="font-mono text-foreground truncate">{claim.value}</div>
                                <div className="text-muted-foreground text-right truncate text-right pr-2">{claim.description.substring(0, 20)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>

                  {/* Payload */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-500 rounded"></div>
                        DECODED PAYLOAD
                      </h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(formatJson(decoded.payload))}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                    
                    <Tabs defaultValue="json" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 h-9">
                        <TabsTrigger value="json" className="text-xs py-1">JSON</TabsTrigger>
                        <TabsTrigger value="claims" className="text-xs py-1">CLAIMS TABLE</TabsTrigger>
                      </TabsList>

                      <TabsContent value="json" className="mt-2">
                        <pre className="bg-background border border-input p-2 rounded text-xs">
                          {formatJson(decoded.payload)}
                        </pre>
                      </TabsContent>

                      <TabsContent value="claims" className="mt-2">
                        <div className="bg-background border border-input rounded overflow-hidden">
                          <div className="grid grid-cols-3 gap-2 p-2 font-semibold text-xs border-b border-border bg-muted/50">
                            <div className="text-purple-600">CLAIM</div>
                            <div className="text-foreground">VALUE</div>
                            <div className="text-muted-foreground text-right pr-2">DESC</div>
                          </div>
                          <div className="divide-y divide-purple-500/20">
                            {formatClaims(decoded.payload).map((claim, index) => (
                              <div key={index} className="grid grid-cols-3 gap-2 p-2 text-xs">
                                <div className="font-mono text-purple-600 truncate">{claim.claim}</div>
                                <div className="font-mono text-foreground truncate">{claim.value}</div>
                                <div className="text-muted-foreground text-right truncate text-right pr-2">{claim.description.substring(0, 20)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>

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
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Status:</span>
                            <Badge variant="secondary" className="h-5 text-xs">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Signature not verified
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-3 p-2 bg-muted/20 rounded border">
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
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}