import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Key, AlertCircle, CheckCircle, Download, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUtilKeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { CopyButton } from "@/components/ui/copy-button";

interface KeyPairGeneratorProps {
  initialContent?: string;
  action?: string;
}

interface GeneratedKeyPair {
  privateKey: string;
  publicKey: string;
  algorithm: string;
  keySize?: number;
  curve?: string;
  comment?: string;
}

export function KeyPairGenerator({ initialContent, action }: KeyPairGeneratorProps) {
  const [algorithm, setAlgorithm] = useState("RSA");
  const [keySize, setKeySize] = useState("4096");
  const [curve, setCurve] = useState("P-256");
  const [format, setFormat] = useState("SSH");
  const [comment, setComment] = useState("");
  const [generatedKeys, setGeneratedKeys] = useState<GeneratedKeyPair | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  // Array buffer to PEM format conversion
  const arrayBufferToPem = (buffer: ArrayBuffer, type: 'PUBLIC KEY' | 'PRIVATE KEY' | 'EC PRIVATE KEY', comment?: string): string => {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    const pem = base64.match(/.{1,64}/g)?.join('\n') || base64;
    const commentHeader = comment ? `# ${comment}\n` : '';
    return `${commentHeader}-----BEGIN ${type}-----\n${pem}\n-----END ${type}-----`;
  };

  // Export key to SSH format (public key only)
  const exportKeyToSsh = async (key: CryptoKey, algorithm: string, comment?: string): Promise<string> => {
    const exported = await crypto.subtle.exportKey('spki', key);
    const base64Key = btoa(String.fromCharCode(...new Uint8Array(exported)));
    
    let sshAlgorithm: string;
    if (algorithm === "RSA") {
      sshAlgorithm = "ssh-rsa";
    } else if (algorithm === "ECDSA") {
      sshAlgorithm = "ecdsa-sha2-nistp256";
    } else {
      throw new Error("SSH format not supported for this algorithm");
    }
    
    const sshComment = comment || "";
    return `${sshAlgorithm} ${base64Key}${sshComment ? ` ${sshComment}` : ''}`;
  };

  // Export key to PEM format
  const exportKeyToPem = async (key: CryptoKey, type: 'public' | 'private', comment?: string): Promise<string> => {
    const format = type === 'public' ? 'spki' : 'pkcs8';
    const exported = await crypto.subtle.exportKey(format, key);
    const keyType = type === 'public' ? 'PUBLIC KEY' : (algorithm === 'RSA' ? 'PRIVATE KEY' : 'EC PRIVATE KEY');
    return arrayBufferToPem(exported, keyType, comment);
  };

  const generateKeyPair = async () => {
    try {
      setError("");
      setIsGenerating(true);
      setGeneratedKeys(null);

      let keyGenParams: RsaHashedKeyGenParams | EcKeyGenParams;

      if (algorithm === "RSA") {
        keyGenParams = {
          name: "RSASSA-PKCS1-v1_5",
          modulusLength: parseInt(keySize),
          publicExponent: new Uint8Array([1, 0, 1]), // 65537
          hash: "SHA-256",
        };
      } else if (algorithm === "ECDSA") {
        keyGenParams = {
          name: "ECDSA",
          namedCurve: curve,
        };
      } else if (algorithm === "Ed25519") {
        // Note: Ed25519 is not supported in Web Crypto API yet
        // We'll use ECDSA with Ed25519 curve as closest alternative
        throw new Error("Ed25519 is not supported in this browser's Web Crypto API. Use ECDSA with P-256 or P-384 instead.");
      } else {
        throw new Error("Unsupported algorithm");
      }

      const keyPair = await crypto.subtle.generateKey(
        keyGenParams,
        true, // extractable
        ["sign", "verify"]
      );

      const [publicKeyPem, privateKeyPem] = await Promise.all([
        exportKeyToPem(keyPair.publicKey, 'public', comment.trim() || undefined),
        exportKeyToPem(keyPair.privateKey, 'private', comment.trim() || undefined)
      ]);

      let publicKeySsh: string | undefined;
      if (format === "SSH") {
        publicKeySsh = await exportKeyToSsh(keyPair.publicKey, algorithm, comment.trim() || undefined);
      }

      const result: GeneratedKeyPair = {
        privateKey: privateKeyPem,
        publicKey: format === "SSH" && publicKeySsh ? publicKeySsh : publicKeyPem,
        algorithm,
        keySize: algorithm === "RSA" ? parseInt(keySize) : undefined,
        curve: algorithm === "ECDSA" ? curve : undefined,
        comment: comment.trim() || undefined,
      };

      setGeneratedKeys(result);

      toast({
        title: "Success!",
        description: `${algorithm} key pair generated successfully`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate key pair";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadKey = (keyType: 'private' | 'public', content: string) => {
    const extension = format === 'SSH' && keyType === 'public' ? 'pub' : (algorithm === 'RSA' ? 'pem' : 'key');
    const commentSuffix = generatedKeys?.comment ? `_${generatedKeys.comment.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
    const filename = `${keyType}_key_${algorithm.toLowerCase()}${commentSuffix}.${extension}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded!",
      description: `${keyType} key saved as ${filename}`,
    });
  };

  const clearAll = useCallback(() => {
    setGeneratedKeys(null);
    setError("");
    setAlgorithm("RSA");
    setKeySize("4096");
    setCurve("P-256");
    setFormat("SSH");
    setComment("");
  }, []);

  useUtilKeyboardShortcuts({
    onExecute: generateKeyPair,
    onClear: clearAll,
  });

  const algorithmOptions = [
    { value: "RSA", label: "RSA", description: "RSA with PKCS#1 v1.5 padding" },
    { value: "ECDSA", label: "ECDSA", description: "Elliptic Curve Digital Signature Algorithm" },
    { value: "Ed25519", label: "Ed25519", description: "Ed25519 (not supported in all browsers)" },
  ];

  const rsaKeySizes = ["1024", "2048", "3072", "4096"];
  const ecdsaCurves = [
    { value: "P-256", label: "P-256 (secp256r1)" },
    { value: "P-384", label: "P-384 (secp384r1)" },
    { value: "P-521", label: "P-521 (secp521r1)" },
  ];

  return (
    <Card className="tool-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Key className="h-5 w-5 text-dev-primary" />
          Key Pair Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Format
            </label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger className="bg-muted/50 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PEM">PEM</SelectItem>
                <SelectItem value="SSH">SSH</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Algorithm
            </label>
            <Select value={algorithm} onValueChange={setAlgorithm}>
              <SelectTrigger className="bg-muted/50 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {algorithmOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {algorithm === "RSA" && (
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Key Size
              </label>
              <Select value={keySize} onValueChange={setKeySize}>
                <SelectTrigger className="bg-muted/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {rsaKeySizes.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size} bits
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {algorithm === "ECDSA" && (
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Curve
              </label>
              <Select value={curve} onValueChange={setCurve}>
                <SelectTrigger className="bg-muted/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ecdsaCurves.map((curveOption) => (
                    <SelectItem key={curveOption.value} value={curveOption.value}>
                      {curveOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">
            Comment/Email (optional)
          </label>
          <input
            type="text"
            placeholder="user@example.com or any identifier"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-3 py-2 bg-muted/50 border border-border/50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-dev-primary/50 focus:border-dev-primary"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Optional comment that will be added to the key files (PEM header or SSH comment)
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={generateKeyPair}
            disabled={isGenerating}
            className="bg-dev-primary hover:bg-dev-primary/80 text-dev-primary-foreground"
          >
            {isGenerating ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Generating...
              </>
            ) : (
              <>
                <Key className="h-4 w-4 mr-2" />
                Generate Key Pair
              </>
            )}
          </Button>
          <Button onClick={clearAll} variant="outline">
            Clear
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {generatedKeys && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                <CheckCircle className="h-3 w-3 mr-1" />
                Keys Generated Successfully
              </Badge>
              <Badge variant="outline">
                {generatedKeys.algorithm}
                {generatedKeys.keySize && ` ${generatedKeys.keySize} bits`}
                {generatedKeys.curve && ` ${generatedKeys.curve}`}
              </Badge>
              {generatedKeys.comment && (
                <Badge variant="outline" className="text-xs">
                  Comment: {generatedKeys.comment}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Private Key */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground">Private Key</h4>
                  <div className="flex gap-1">
                    <CopyButton
                      text={generatedKeys.privateKey}
                      title="Copy private key"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadKey('private', generatedKeys.privateKey)}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={generatedKeys.privateKey}
                  readOnly
                  className="font-mono text-xs bg-muted/50 border-border/50 min-h-[200px]"
                />
              </div>

              {/* Public Key */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground">Public Key</h4>
                  <div className="flex gap-1">
                    <CopyButton
                      text={generatedKeys.publicKey}
                      title="Copy public key"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadKey('public', generatedKeys.publicKey)}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={generatedKeys.publicKey}
                  readOnly
                  className="font-mono text-xs bg-muted/50 border-border/50 min-h-[200px]"
                />
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Security Notice:</strong> Keep your private key secure and never share it.
                The public key can be safely distributed and used for verification.
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div className="p-3 bg-muted/20 rounded-lg border border-border/50 text-sm text-muted-foreground space-y-2">
          <div><strong>PEM Format:</strong> Standard for SSL/TLS certificates and web servers</div>
          <div><strong>SSH Format:</strong> Single-line format for SSH authentication (public key only)</div>
          <div><strong>RSA:</strong> Recommended for most applications. 2048-bit minimum for security.</div>
          <div><strong>ECDSA:</strong> More efficient than RSA with equivalent security. P-256 is widely supported.</div>
          <div><strong>Ed25519:</strong> Modern elliptic curve algorithm, but not supported in all browsers.</div>
          <div><strong>Note:</strong> Keys are generated using your browser's Web Crypto API and never leave your device.</div>
        </div>
      </CardContent>
    </Card>
  );
}