import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Hash, RotateCcw, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
// import CryptoJS from "crypto-js";
// import bcrypt from "bcryptjs"; // Moved to dynamic imports
import { useUtilKeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { CopyButton } from "@/components/ui/copy-button";

interface HashResult {
  md5: string;
  sha1: string;
  sha256: string;
  sha512: string;
  bcrypt: string;
}

interface HashGeneratorProps {
  initialContent?: string;
  action?: string;
}

export function HashGenerator({ initialContent, action }: HashGeneratorProps) {
  const [input, setInput] = useState(initialContent || "");
  const [hashes, setHashes] = useState<HashResult>({
    md5: "",
    sha1: "",
    sha256: "",
    sha512: "",
    bcrypt: ""
  });
  const [saltRounds, setSaltRounds] = useState(10);
  const [isGeneratingBcrypt, setIsGeneratingBcrypt] = useState(false);
  const [hashToVerify, setHashToVerify] = useState("");
  const [verificationResult, setVerificationResult] = useState<string>("");
  const [cryptoJS, setCryptoJS] = useState<typeof import("crypto-js") | null>(null);
  const [bcryptLib, setBcryptLib] = useState<typeof import("bcryptjs") | null>(null);
  const [isLoadingLibs, setIsLoadingLibs] = useState(false);
  const { toast } = useToast();

  // Load crypto libraries on component mount
  useEffect(() => {
    const loadLibs = async () => {
      setIsLoadingLibs(true);
      try {
        const [cryptoModule, bcryptModule] = await Promise.all([
          import("crypto-js"),
          import("bcryptjs")
        ]);
        setCryptoJS(cryptoModule.default);
        setBcryptLib(bcryptModule);
      } catch (error) {
        console.error("Failed to load crypto libraries:", error);
        toast({
          title: "Error",
          description: "Failed to load crypto libraries",
          variant: "destructive",
        });
      } finally {
        setIsLoadingLibs(false);
      }
    };
    loadLibs();
  }, [toast]);

  // Auto-generate hashes when input changes (debounced)
  useEffect(() => {
    if (!input.trim() || !cryptoJS) {
      setHashes({ md5: "", sha1: "", sha256: "", sha512: "", bcrypt: "" });
      return;
    }

    const timeoutId = setTimeout(() => {
      // Generate sync hashes immediately
      const syncHashes = {
        md5: cryptoJS.MD5(input).toString(),
        sha1: cryptoJS.SHA1(input).toString(),
        sha256: cryptoJS.SHA256(input).toString(),
        sha512: cryptoJS.SHA512(input).toString(),
        bcrypt: ""
      };
      setHashes(syncHashes);

      // Generate bcrypt hash asynchronously
      if (bcryptLib) {
        setIsGeneratingBcrypt(true);
        bcryptLib.hash(input, saltRounds)
          .then((bcryptHash: string) => {
            setHashes(prev => ({ ...prev, bcrypt: bcryptHash }));
          })
          .catch((error: unknown) => {
            console.error("Error generating bcrypt hash:", error);
            toast({
              title: "Error",
              description: "Failed to generate bcrypt hash",
              variant: "destructive",
            });
          })
          .finally(() => {
            setIsGeneratingBcrypt(false);
          });
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [input, cryptoJS, bcryptLib, saltRounds, toast]);

  const generateHashes = useCallback(async () => {
    if (!input.trim() || !cryptoJS) {
      setHashes({ md5: "", sha1: "", sha256: "", sha512: "", bcrypt: "" });
      return;
    }

    // Generate sync hashes immediately
    const syncHashes = {
      md5: cryptoJS.MD5(input).toString(),
      sha1: cryptoJS.SHA1(input).toString(),
      sha256: cryptoJS.SHA256(input).toString(),
      sha512: cryptoJS.SHA512(input).toString(),
      bcrypt: ""
    };
    setHashes(syncHashes);

    // Generate bcrypt hash asynchronously
    if (bcryptLib) {
      setIsGeneratingBcrypt(true);
      try {
        const bcryptHash = await bcryptLib.hash(input, saltRounds);
        setHashes(prev => ({ ...prev, bcrypt: bcryptHash }));
      } catch (error) {
        console.error("Error generating bcrypt hash:", error);
        toast({
          title: "Error",
          description: "Failed to generate bcrypt hash",
          variant: "destructive",
        });
      } finally {
        setIsGeneratingBcrypt(false);
      }
    }
  }, [input, cryptoJS, bcryptLib, saltRounds, toast]);

  const copyAllHashes = useCallback(async () => {
    if (!hashes.sha256) return;
    const allHashes = `MD5: ${hashes.md5}\nSHA1: ${hashes.sha1}\nSHA256: ${hashes.sha256}\nSHA512: ${hashes.sha512}\nBcrypt: ${hashes.bcrypt}`;
    try {
      await navigator.clipboard.writeText(allHashes);
      toast({
        title: "Copied!",
        description: "All hashes copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  }, [hashes, toast]);

  const clearAll = useCallback(() => {
    setInput("");
    setHashes({ md5: "", sha1: "", sha256: "", sha512: "", bcrypt: "" });
    setSaltRounds(10);
    setHashToVerify("");
    setVerificationResult("");
  }, []);

  // Keyboard shortcuts
  useUtilKeyboardShortcuts({
    onExecute: generateHashes,
    onClear: clearAll,
    onCopy: copyAllHashes,
  });

  useEffect(() => {
    if (initialContent && action === "hash") {
      generateHashes();
    }
  }, [initialContent, action, generateHashes]);

  const verifyHash = async () => {
    if (!input.trim() || !hashToVerify.trim()) {
      setVerificationResult("Please enter both text and hash to verify");
      return;
    }

    if (!cryptoJS || !bcryptLib) {
      setVerificationResult("Crypto libraries not loaded yet");
      return;
    }

    const currentHashes = {
      md5: cryptoJS.MD5(input).toString(),
      sha1: cryptoJS.SHA1(input).toString(),
      sha256: cryptoJS.SHA256(input).toString(),
      sha512: cryptoJS.SHA512(input).toString()
    };

    const hashLower = hashToVerify.toLowerCase();
    let matchFound = false;
    let matchType = "";

    // Check sync hashes
    Object.entries(currentHashes).forEach(([type, hash]) => {
      if (hash === hashLower) {
        matchFound = true;
        matchType = type.toUpperCase();
      }
    });

    // Check bcrypt if not found in sync hashes
    if (!matchFound) {
      try {
        const isBcryptMatch = await bcryptLib.compare(input, hashToVerify);
        if (isBcryptMatch) {
          matchFound = true;
          matchType = "BCRYPT";
        }
      } catch (error) {
        // If bcrypt.compare fails, it's not a valid bcrypt hash
      }
    }

    if (matchFound) {
      setVerificationResult(`✅ Hash verified! Matches ${matchType} algorithm`);
    } else {
      setVerificationResult("❌ Hash does not match any generated hash");
    }
  };

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({
        title: "Copied!",
        description: "Hash value copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const hashAlgorithms = [
    { name: "MD5", key: "md5" as keyof HashResult, description: "128-bit (not cryptographically secure)" },
    { name: "SHA1", key: "sha1" as keyof HashResult, description: "160-bit (deprecated for security)" },
    { name: "SHA256", key: "sha256" as keyof HashResult, description: "256-bit (recommended)" },
    { name: "SHA512", key: "sha512" as keyof HashResult, description: "512-bit (highest security)" },
    { name: "Bcrypt", key: "bcrypt" as keyof HashResult, description: "Password hashing (adaptive, slow)" }
  ];

  return (
    <Card className="tool-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Hash className="h-5 w-5 text-dev-primary" />
          Hash Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input & options bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground">Text to Hash</label>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Bcrypt rounds</label>
              <Input
                type="number"
                min="4"
                max="20"
                value={saltRounds}
                onChange={(e) => setSaltRounds(parseInt(e.target.value) || 10)}
                className="w-16 h-7 text-xs bg-muted/50 border-border/50"
              />
              <Button onClick={clearAll} variant="outline" size="sm">
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Clear
              </Button>
            </div>
          </div>
          <Textarea
            placeholder="Enter text to generate hashes..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full min-h-[100px] bg-muted/50 border-border/50 font-mono text-sm"
          />
          {isLoadingLibs && (
            <p className="text-xs text-muted-foreground mt-1">Loading crypto libraries…</p>
          )}
        </div>

        {/* Hash results */}
        {(hashes.md5 || hashes.sha1 || hashes.sha256 || hashes.sha512 || hashes.bcrypt) && (
          <div className="space-y-2">
            {hashAlgorithms.map((algo) => {
              const hashValue = hashes[algo.key];
              if (!hashValue && algo.key !== 'bcrypt') return null;
              
              return (
                <div key={algo.key} className="flex items-start gap-3 p-2.5 bg-muted/30 rounded-md border border-border/50 hover:border-dev-primary/30 transition-colors">
                  <div className="flex items-center gap-2 shrink-0 w-24">
                    <Badge variant="outline" className="font-semibold text-xs">
                      {algo.name}
                    </Badge>
                  </div>
                  <code className="text-xs font-mono text-foreground break-all flex-1 pt-0.5">
                    {hashValue || (algo.key === 'bcrypt' && isGeneratingBcrypt ? "Generating…" : "")}
                  </code>
                  {hashValue && (
                    <CopyButton
                      text={hashValue}
                      title={`Copy ${algo.name}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Verifier section */}
        <Collapsible className="border-t border-border/50 pt-3">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-foreground px-0">
              <CheckCircle className="h-3.5 w-3.5 mr-2" />
              Verify a hash
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-end gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium mb-1 text-foreground">
                  Hash to Verify
                </label>
                <Input
                  placeholder="Paste hash to verify against input text…"
                  value={hashToVerify}
                  onChange={(e) => setHashToVerify(e.target.value)}
                  className="font-mono text-sm bg-muted/50 border-border/50"
                />
              </div>
              <Button onClick={verifyHash} size="sm" className="bg-dev-primary hover:bg-dev-primary/80 text-dev-primary-foreground">
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                Verify
              </Button>
            </div>
            {verificationResult && (
              <div className={`p-3 rounded-md border text-sm font-medium flex items-center gap-2 ${
                verificationResult.includes("✅") 
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                  : "bg-red-500/10 text-red-600 border-red-500/20"
              }`}>
                {verificationResult.includes("✅") ? (
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                )}
                <span>{verificationResult.replace("✅ ", "").replace("❌ ", "")}</span>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}