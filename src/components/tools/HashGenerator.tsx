import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Hash, RotateCcw, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
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
      <CardContent className="space-y-6">
        <Tabs defaultValue="generator" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generator">Generator</TabsTrigger>
            <TabsTrigger value="verifier">Verifier</TabsTrigger>
          </TabsList>

          {/* Generator Tab */}
          <TabsContent value="generator" className="space-y-4 pt-4">
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
                className="w-full min-h-[120px] bg-muted/50 border-border/50 font-mono text-sm"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={generateHashes} className="bg-dev-primary hover:bg-dev-primary/80 text-dev-primary-foreground">
                <Hash className="h-4 w-4 mr-2" />
                Generate Hashes
              </Button>
              <Button onClick={clearAll} variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>

            {(hashes.md5 || hashes.sha1 || hashes.sha256 || hashes.sha512) && (
              <div className="space-y-3 pt-2">
                {hashAlgorithms.map((algo) => {
                  const hashValue = hashes[algo.key];
                  if (!hashValue) return null;
                  
                  return (
                    <div key={algo.key} className="p-4 bg-muted/30 rounded-lg border border-border/50 hover:border-dev-primary/30 transition-colors group">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-semibold">
                            {algo.name}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{algo.description}</span>
                        </div>
                        <Button
                          onClick={() => copyToClipboard(hashValue)}
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <code className="text-sm font-mono text-foreground break-all block">
                        {hashValue}
                      </code>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="p-3 bg-muted/20 rounded-lg border border-border/50 text-sm text-muted-foreground space-y-1">
              <div><strong>MD5:</strong> Fast but not secure for passwords (128-bit)</div>
              <div><strong>SHA1:</strong> Deprecated for security applications (160-bit)</div>
              <div><strong>SHA256:</strong> Current standard for most applications (256-bit)</div>
              <div><strong>SHA512:</strong> Highest security, larger output (512-bit)</div>
            </div>
          </TabsContent>

          {/* Verifier Tab */}
          <TabsContent value="verifier" className="space-y-4 pt-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Original Text
              </label>
              <Textarea
                placeholder="Enter the original text..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full min-h-[100px] bg-muted/50 border-border/50 font-mono text-sm"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Hash to Verify
                </label>
                <Input
                  placeholder="Enter hash to verify..."
                  value={hashToVerify}
                  onChange={(e) => setHashToVerify(e.target.value)}
                  className="font-mono text-sm bg-muted/50 border-border/50"
                />
              </div>
              <Button onClick={verifyHash} className="bg-dev-primary hover:bg-dev-primary/80 text-dev-primary-foreground w-full sm:w-auto">
                <CheckCircle className="h-4 w-4 mr-2" />
                Verify
              </Button>
            </div>
            
            {verificationResult && (
              <div className={`p-4 rounded-lg border text-sm font-medium flex items-start gap-2 ${
                verificationResult.includes("✅") 
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                  : "bg-red-500/10 text-red-600 border-red-500/20"
              }`}>
                {verificationResult.includes("✅") ? (
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                )}
                <span>{verificationResult.replace("✅ ", "").replace("❌ ", "")}</span>
              </div>
            )}

            <div className="p-3 bg-muted/20 rounded-lg border border-border/50 text-sm text-muted-foreground">
              <strong>Note:</strong> Enter the original text and a hash value to verify if they match. The verifier will check against all supported algorithms (MD5, SHA1, SHA256, SHA512).
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}