import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Hash, Copy, RefreshCw, Trash2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4, v1 as uuidv1 } from "uuid";

interface DecodedV1 {
  date: Date;
  dateString: string;
  node: string;
  clockSeq: number;
  variant: string;
  timestamp100ns: bigint;
}

interface GeneratedUuid {
  id: string;
  value: string;
  version: string;
  timestamp: string;
}

interface UuidGeneratorProps {
  initialContent?: string;
  action?: string;
}

export function UuidGeneratorDecoder({ initialContent, action }: UuidGeneratorProps) {
  const [uuids, setUuids] = useState<GeneratedUuid[]>([]);
  const [count, setCount] = useState(1);
  const [validationInput, setValidationInput] = useState(initialContent || "");
  const { toast } = useToast();

  useEffect(() => {
    if (initialContent && action === "validate") {
      setValidationInput(initialContent);
    }
  }, [initialContent, action]);

  const generateUuid = (version: 'v1' | 'v4', quantity = 1) => {
    const newUuids: GeneratedUuid[] = [];
    
    for (let i = 0; i < quantity; i++) {
      const value = version === 'v4' ? uuidv4() : uuidv1();
      newUuids.push({
        id: uuidv4(), // For React key
        value,
        version,
        timestamp: new Date().toLocaleTimeString(),
      });
    }
    
    setUuids(prev => [...newUuids, ...prev]);
    
    toast({
      title: "Generated!",
      description: `${quantity} UUID${quantity > 1 ? 's' : ''} generated`,
    });
  };

  const copyToClipboard = async (value: string) => {
    await navigator.clipboard.writeText(value);
    toast({
      title: "Copied!",
      description: "UUID copied to clipboard",
    });
  };

  const copyDecodedToClipboard = async (decoded: DecodedV1 | null) => {
    if (!decoded) return;
    const text = `Timestamp: ${decoded.date.toISOString()}\nClock Sequence: ${decoded.clockSeq}\nNode: ${decoded.node}\nVariant: ${decoded.variant}`;
    await navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Decoded UUID copied to clipboard" });
  };

  const copyAllUuids = async () => {
    const allValues = uuids.map(uuid => uuid.value).join('\n');
    await navigator.clipboard.writeText(allValues);
    toast({
      title: "All Copied!",
      description: `${uuids.length} UUIDs copied to clipboard`,
    });
  };

  const clearAll = () => {
    setUuids([]);
    toast({
      title: "Cleared",
      description: "All UUIDs removed",
    });
  };

  const validateUuid = (uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  const decodeUuidV1 = (uuid: string): DecodedV1 | null => {
    const match = uuid.match(/^([0-9a-f]{8})-([0-9a-f]{4})-([1-5][0-9a-f]{3})-([0-9a-f]{4})-([0-9a-f]{12})$/i);
    if (!match) return null;

    const [, time_low, time_mid, time_hi_and_version, clock_seq, node] = match;

    const tl = parseInt(time_low, 16) >>> 0; // 32-bit
    const tm = parseInt(time_mid, 16) & 0xffff; // 16-bit
    const th = parseInt(time_hi_and_version, 16) & 0xffff; // 16-bit

    const version = (th >> 12) & 0xf;
    if (version !== 1) return null;

    const timeHi = th & 0x0fff; // lower 12 bits

    // Build 60-bit timestamp: (timeHi << 48) | (time_mid << 32) | time_low
    const timestamp100ns = (BigInt(timeHi) << 48n) | (BigInt(tm) << 32n) | BigInt(tl);

    // UUID timestamp counts 100-ns intervals since 1582-10-15
    const msSinceUuidEpoch = Number(timestamp100ns / 10000n); // safe after division
    const uuidEpochMs = Date.UTC(1582, 9, 15); // months are 0-based; October = 9
    const unixMs = msSinceUuidEpoch + uuidEpochMs;
    const date = new Date(unixMs);

    // clock sequence: 14 bits from clock_seq (two bytes)
    const csHi = parseInt(clock_seq.slice(0, 2), 16) & 0xff;
    const csLo = parseInt(clock_seq.slice(2, 4), 16) & 0xff;
    const clockSeqVal = ((csHi & 0x3f) << 8) | csLo;

    // variant
    let variant = "unknown";
    if ((csHi & 0x80) === 0x00) variant = "NCS";
    else if ((csHi & 0xc0) === 0x80) variant = "RFC 4122";
    else if ((csHi & 0xe0) === 0xc0) variant = "Microsoft";
    else if ((csHi & 0xe0) === 0xe0) variant = "Future";

    // format node
    const nodeFormatted = node.match(/.{1,2}/g)?.join(":") ?? node;

    return {
      date,
      dateString: date.toUTCString(),
      node: nodeFormatted,
      clockSeq: clockSeqVal,
      variant,
      timestamp100ns,
    };
  };

  const isValidUuid = validationInput ? validateUuid(validationInput) : null;
  const decodedValidation = isValidUuid ? decodeUuidV1(validationInput) : null;

  return (
    <div className="space-y-6">
      {/* Generator Section */}
      <Card className="tool-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Hash className="h-5 w-5 text-dev-primary" />
            UUID Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="1"
              max="100"
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
              className="w-20 bg-muted/50 border-border/50"
            />
            <span className="text-sm text-muted-foreground">UUIDs to generate</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => generateUuid('v4', count)}
              className="bg-dev-primary hover:bg-dev-primary/80 text-dev-primary-foreground"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Generate UUID v4
            </Button>
            
            <Button
              onClick={() => generateUuid('v1', count)}
              variant="secondary"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Generate UUID v1
            </Button>

            {uuids.length > 0 && (
              <>
                <Button
                  onClick={copyAllUuids}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy All
                </Button>
                
                <Button
                  onClick={clearAll}
                  variant="outline"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </>
            )}
          </div>

          {/* Generated UUIDs List */}
          {uuids.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  Generated UUIDs ({uuids.length})
                </label>
              </div>
              
              <div className="space-y-2 max-h-[300px] overflow-auto">
                {uuids.map((uuid) => {
                  const decoded = uuid.version === 'v1' ? decodeUuidV1(uuid.value) : null;
                  return (
                    <div
                      key={uuid.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-md border border-border/30 group hover:border-dev-primary/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-mono text-sm text-foreground break-all min-w-0">
                            {uuid.value}
                          </div>
                          <div className="flex-shrink-0">
                            <Button
                              onClick={() => copyToClipboard(uuid.value)}
                              variant="ghost"
                              size="sm"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {uuid.version}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {uuid.timestamp}
                          </span>
                        </div>
                        {decoded && (
                          <div className="mt-2 text-xs font-mono text-muted-foreground">
                            <div>Timestamp: {decoded.date.toUTCString()}</div>
                            <div>Clock Seq: {decoded.clockSeq} • Node: {decoded.node}</div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {decoded && (
                          <Button onClick={() => copyDecodedToClipboard(decoded)} variant="ghost" size="sm">
                            <Copy className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Generator Info */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>UUID v1:</strong> Time-based, includes MAC address</p>
            <p><strong>UUID v4:</strong> Random/pseudo-random generation</p>
          </div>
        </CardContent>
      </Card>

      {/* Validator Section */}
      <Card className="tool-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Search className="h-5 w-5 text-dev-primary" />
            UUID Validator & Decoder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Enter UUID to validate..."
                value={validationInput}
                onChange={(e) => setValidationInput(e.target.value)}
                className="font-mono bg-muted/50 border-border/50"
              />
              {isValidUuid !== null && (
                <Badge 
                  className={isValidUuid 
                    ? "bg-dev-success text-dev-success-foreground" 
                    : "bg-dev-error text-dev-error-foreground"
                  }
                >
                  {isValidUuid ? "Valid" : "Invalid"}
                </Badge>
              )}
            </div>
            {decodedValidation && (
              <div className="mt-2 text-sm font-mono text-muted-foreground flex items-start justify-between">
                <div>
                  <div>Timestamp: {decodedValidation.dateString} ({decodedValidation.date.toISOString()})</div>
                  <div>Clock Sequence: {decodedValidation.clockSeq}</div>
                  <div>Node: {decodedValidation.node}</div>
                  <div>Variant: {decodedValidation.variant}</div>
                </div>
                <div className="ml-4">
                  <Button onClick={() => copyDecodedToClipboard(decodedValidation)} size="sm" variant="outline">
                    <Copy className="h-4 w-4 mr-1" />
                    Copy decoded
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default UuidGeneratorDecoder;