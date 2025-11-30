import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Hash, RotateCcw, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CryptoJS from "crypto-js";

interface HashResult {
  md5: string;
  sha1: string;
  sha256: string;
  sha512: string;
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
    sha512: ""
  });
  const [hashToVerify, setHashToVerify] = useState("");
  const [verificationResult, setVerificationResult] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    if (initialContent && action === "hash") {
      generateHashes();
    }
  }, [initialContent, action]);

  const generateHashes = () => {
    if (!input.trim()) {
      setHashes({ md5: "", sha1: "", sha256: "", sha512: "" });
      return;
    }

    setHashes({
      md5: CryptoJS.MD5(input).toString(),
      sha1: CryptoJS.SHA1(input).toString(),
      sha256: CryptoJS.SHA256(input).toString(),
      sha512: CryptoJS.SHA512(input).toString()
    });
  };

  const verifyHash = () => {
    if (!input.trim() || !hashToVerify.trim()) {
      setVerificationResult("Please enter both text and hash to verify");
      return;
    }

    const currentHashes = {
      md5: CryptoJS.MD5(input).toString(),
      sha1: CryptoJS.SHA1(input).toString(),
      sha256: CryptoJS.SHA256(input).toString(),
      sha512: CryptoJS.SHA512(input).toString()
    };

    const hashLower = hashToVerify.toLowerCase();
    let matchFound = false;
    let matchType = "";

    Object.entries(currentHashes).forEach(([type, hash]) => {
      if (hash === hashLower) {
        matchFound = true;
        matchType = type.toUpperCase();
      }
    });

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

  const clearAll = () => {
    setInput("");
    setHashes({ md5: "", sha1: "", sha256: "", sha512: "" });
    setHashToVerify("");
    setVerificationResult("");
  };

  const hashAlgorithms = [
    { name: "MD5", key: "md5" as keyof HashResult, description: "128-bit (not cryptographically secure)" },
    { name: "SHA1", key: "sha1" as keyof HashResult, description: "160-bit (deprecated for security)" },
    { name: "SHA256", key: "sha256" as keyof HashResult, description: "256-bit (recommended)" },
    { name: "SHA512", key: "sha512" as keyof HashResult, description: "512-bit (highest security)" }
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
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">
            Text to Hash
          </label>
          <Textarea
            placeholder="Enter text to generate hashes..."
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              // Auto-generate hashes as user types
              if (e.target.value.trim()) {
                setHashes({
                  md5: CryptoJS.MD5(e.target.value).toString(),
                  sha1: CryptoJS.SHA1(e.target.value).toString(),
                  sha256: CryptoJS.SHA256(e.target.value).toString(),
                  sha512: CryptoJS.SHA512(e.target.value).toString()
                });
              } else {
                setHashes({ md5: "", sha1: "", sha256: "", sha512: "" });
              }
            }}
            className="w-full min-h-[120px] bg-muted/50 border-border/50"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={generateHashes} className="bg-dev-primary hover:bg-dev-primary/80 text-dev-primary-foreground px-4">
            <Hash className="h-4 w-4 mr-2" />
            Generate Hashes
          </Button>
          <Button onClick={clearAll} variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>

        {(hashes.md5 || hashes.sha1 || hashes.sha256 || hashes.sha512) && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-dev-primary">Generated Hashes</h4>
            <div className="space-y-3">
              {hashAlgorithms.map((algo) => {
                const hashValue = hashes[algo.key];
                if (!hashValue) return null;
                
                return (
                  <div key={algo.key} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-foreground">{algo.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{algo.description}</span>
                      </div>
                      <Button
                        onClick={() => copyToClipboard(hashValue)}
                        variant="outline"
                        size="sm"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-md border border-border/50">
                      <code className="text-xs font-mono text-foreground break-all">
                        {hashValue}
                      </code>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="border-t border-border/50 pt-4">
          <h4 className="text-sm font-semibold text-dev-primary mb-3">Hash Verification</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Hash to Verify
              </label>
              <Input
                placeholder="Enter hash to verify against the text above..."
                value={hashToVerify}
                onChange={(e) => setHashToVerify(e.target.value)}
                className="w-full font-mono text-sm bg-muted/50 border-border/50"
              />
            </div>
            
            <Button onClick={verifyHash} className="bg-dev-primary hover:bg-dev-primary/80 text-dev-primary-foreground px-4">
              <CheckCircle className="h-4 w-4 mr-2" />
              Verify Hash
            </Button>
            
            {verificationResult && (
              <div className={`p-3 rounded-md text-sm font-medium ${
                verificationResult.includes("✅") 
                  ? "bg-green-500/10 text-green-600 dark:text-green-400 dark:bg-green-950/20" 
                  : "bg-red-500/10 text-red-600 dark:text-red-400 dark:bg-red-950/20"
              }`}>
                {verificationResult}
              </div>
            )}
          </div>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <div><strong>MD5:</strong> Fast but not secure for passwords</div>
          <div><strong>SHA1:</strong> Deprecated for security applications</div>
          <div><strong>SHA256:</strong> Current standard for most applications</div>
          <div><strong>SHA512:</strong> Highest security, larger output</div>
        </div>
      </CardContent>
    </Card>
  );
}