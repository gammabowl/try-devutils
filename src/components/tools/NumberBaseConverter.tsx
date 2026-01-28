import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Binary, Copy, AlertCircle, ArrowDown, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useToolKeyboardShortcuts } from "@/components/KeyboardShortcuts";

type Base = "2" | "8" | "10" | "16" | "32" | "64";

interface BaseInfo {
  name: string;
  prefix: string;
  regex: RegExp;
  description: string;
}

const bases: Record<Base, BaseInfo> = {
  "2": { name: "Binary", prefix: "0b", regex: /^[01]+$/, description: "Base 2 (0-1)" },
  "8": { name: "Octal", prefix: "0o", regex: /^[0-7]+$/, description: "Base 8 (0-7)" },
  "10": { name: "Decimal", prefix: "", regex: /^[0-9]+$/, description: "Base 10 (0-9)" },
  "16": { name: "Hexadecimal", prefix: "0x", regex: /^[0-9a-fA-F]+$/, description: "Base 16 (0-9, A-F)" },
  "32": { name: "Base32", prefix: "", regex: /^[A-Z2-7]+$/i, description: "Base 32 (A-Z, 2-7)" },
  "64": { name: "Base64", prefix: "", regex: /^[A-Za-z0-9+/=]+$/, description: "Base 64" },
};

interface NumberBaseConverterProps {
  initialContent?: string;
  action?: string;
}

// Base32 alphabet (RFC 4648)
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function bigIntToBase32(num: bigint): string {
  if (num === 0n) return "A";
  let result = "";
  while (num > 0n) {
    result = BASE32_ALPHABET[Number(num % 32n)] + result;
    num = num / 32n;
  }
  return result;
}

function base32ToBigInt(str: string): bigint {
  let result = 0n;
  const upper = str.toUpperCase();
  for (const char of upper) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) throw new Error(`Invalid Base32 character: ${char}`);
    result = result * 32n + BigInt(index);
  }
  return result;
}

// Base64 for numbers (using standard alphabet)
const BASE64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function bigIntToBase64Num(num: bigint): string {
  if (num === 0n) return "A";
  let result = "";
  while (num > 0n) {
    result = BASE64_ALPHABET[Number(num % 64n)] + result;
    num = num / 64n;
  }
  return result;
}

function base64NumToBigInt(str: string): bigint {
  let result = 0n;
  for (const char of str) {
    if (char === "=") continue; // Skip padding
    const index = BASE64_ALPHABET.indexOf(char);
    if (index === -1) throw new Error(`Invalid Base64 character: ${char}`);
    result = result * 64n + BigInt(index);
  }
  return result;
}

export function NumberBaseConverter({ initialContent }: NumberBaseConverterProps) {
  const [input, setInput] = useState(initialContent || "");
  const [fromBase, setFromBase] = useState<Base>("10");
  const [toBase, setToBase] = useState<Base>("16");
  const [result, setResult] = useState("");
  const [allBases, setAllBases] = useState<Record<Base, string>>({} as Record<Base, string>);
  const [error, setError] = useState("");

  const { toast } = useToast();

  const examples = [
    { value: "255", base: "10" as Base, desc: "Decimal 255 (max byte value)" },
    { value: "11111111", base: "2" as Base, desc: "Binary 11111111" },
    { value: "FF", base: "16" as Base, desc: "Hexadecimal FF" },
    { value: "1000000", base: "10" as Base, desc: "One million in decimal" },
    { value: "DEADBEEF", base: "16" as Base, desc: "Classic hex value" },
  ];

  const cleanInput = (value: string, base: Base): string => {
    // Remove common prefixes
    let cleaned = value.trim();
    if (base === "2" && cleaned.toLowerCase().startsWith("0b")) {
      cleaned = cleaned.slice(2);
    } else if (base === "8" && cleaned.toLowerCase().startsWith("0o")) {
      cleaned = cleaned.slice(2);
    } else if (base === "16" && cleaned.toLowerCase().startsWith("0x")) {
      cleaned = cleaned.slice(2);
    }
    return cleaned;
  };

  const validateInput = (value: string, base: Base): boolean => {
    if (!value) return false;
    const cleaned = cleanInput(value, base);
    return bases[base].regex.test(cleaned);
  };

  const convert = () => {
    setError("");
    setResult("");
    setAllBases({} as Record<Base, string>);

    if (!input.trim()) {
      setError("Please enter a value to convert");
      return;
    }

    const cleaned = cleanInput(input, fromBase);

    if (!validateInput(input, fromBase)) {
      setError(`Invalid ${bases[fromBase].name} value. ${bases[fromBase].description}`);
      return;
    }

    try {
      // Convert to BigInt first (supports large numbers)
      let decimalValue: bigint;

      if (fromBase === "32") {
        decimalValue = base32ToBigInt(cleaned);
      } else if (fromBase === "64") {
        decimalValue = base64NumToBigInt(cleaned);
      } else {
        decimalValue = BigInt("0x0") + BigInt(parseInt(fromBase) === 10 ? cleaned : `0${"xob"[["16", "8", "2"].indexOf(fromBase)]}${cleaned}`);
        // Simpler approach for standard bases
        decimalValue = BigInt(parseInt(cleaned, parseInt(fromBase)));
      }

      // Convert to target base
      let converted: string;
      if (toBase === "32") {
        converted = bigIntToBase32(decimalValue);
      } else if (toBase === "64") {
        converted = bigIntToBase64Num(decimalValue);
      } else {
        converted = decimalValue.toString(parseInt(toBase));
        if (toBase === "16") converted = converted.toUpperCase();
      }

      setResult(converted);

      // Calculate all bases for reference
      const all: Record<Base, string> = {
        "2": decimalValue.toString(2),
        "8": decimalValue.toString(8),
        "10": decimalValue.toString(10),
        "16": decimalValue.toString(16).toUpperCase(),
        "32": bigIntToBase32(decimalValue),
        "64": bigIntToBase64Num(decimalValue),
      };
      setAllBases(all);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion failed");
    }
  };

  useEffect(() => {
    if (input) {
      convert();
    }
  }, [fromBase, toBase]);

  const copyToClipboard = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Value copied to clipboard",
    });
  }, [toast]);

  const swapBases = () => {
    const tempFrom = fromBase;
    setFromBase(toBase);
    setToBase(tempFrom);
    if (result) {
      setInput(result);
    }
  };

  const clearAll = useCallback(() => {
    setInput("");
    setResult("");
    setAllBases({} as Record<Base, string>);
    setError("");
  }, []);

  // Keyboard shortcuts
  useToolKeyboardShortcuts({
    onExecute: convert,
    onClear: clearAll,
    onCopy: () => result && copyToClipboard(result),
  });

  return (
    <Card className="tool-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Binary className="h-5 w-5 text-dev-primary" />
          Number Base Converter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              From Base
            </label>
            <Select value={fromBase} onValueChange={(v: Base) => setFromBase(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(bases) as Base[]).map((base) => (
                  <SelectItem key={base} value={base}>
                    {bases[base].name} ({bases[base].description})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              To Base
            </label>
            <Select value={toBase} onValueChange={(v: Base) => setToBase(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(bases) as Base[]).map((base) => (
                  <SelectItem key={base} value={base}>
                    {bases[base].name} ({bases[base].description})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">
            Input Value ({bases[fromBase].name})
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              {bases[fromBase].prefix && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">
                  {bases[fromBase].prefix}
                </span>
              )}
              <Input
                placeholder={`Enter ${bases[fromBase].name.toLowerCase()} value...`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && convert()}
                className={`font-mono ${bases[fromBase].prefix ? "pl-10" : ""}`}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={convert}
            className="bg-dev-primary hover:bg-dev-primary/80 text-dev-primary-foreground"
          >
            <ArrowDown className="h-4 w-4 mr-1" />
            Convert
          </Button>
          <Button onClick={swapBases} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-1" />
            Swap
          </Button>
          <Button onClick={clearAll} variant="outline" size="sm">
            Clear
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-foreground">
                Result ({bases[toBase].name})
              </label>
              <Badge variant="outline">{bases[toBase].description}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted/50 p-3 rounded-md font-mono text-lg overflow-auto border border-border/50">
                {bases[toBase].prefix && (
                  <span className="text-muted-foreground">{bases[toBase].prefix}</span>
                )}
                {result}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(result)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {Object.keys(allBases).length > 0 && (
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              All Representations
            </label>
            <div className="bg-muted/50 rounded-md border border-border/50 overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {(Object.keys(bases) as Base[]).map((base) => (
                    <tr key={base} className="border-b border-border/50 last:border-b-0">
                      <td className="p-2 w-28">
                        <Badge variant="outline">{bases[base].name}</Badge>
                      </td>
                      <td className="p-2 font-mono text-xs break-all">
                        <span className="text-muted-foreground">{bases[base].prefix}</span>
                        {allBases[base]}
                      </td>
                      <td className="p-2 w-10">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => copyToClipboard(allBases[base])}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>

      <div className="border-t border-border/50 px-6 py-4">
        <Collapsible defaultOpen={false} className="w-full">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-start">
              Examples
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            {examples.map((example, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-muted rounded-md"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm text-foreground">
                    {bases[example.base].prefix}{example.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {example.desc}
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setFromBase(example.base);
                    setInput(example.value);
                  }}
                  variant="outline"
                  size="sm"
                  className="ml-2 flex-shrink-0"
                >
                  Use
                </Button>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </Card>
  );
}
