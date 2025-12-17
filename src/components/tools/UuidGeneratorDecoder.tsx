import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Hash, Copy, RefreshCw, Trash2, CheckCircle, AlertCircle, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4, v1 as uuidv1, v3 as uuidv3, v5 as uuidv5 } from "uuid";

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
  const [selectedVersion, setSelectedVersion] = useState<'v1' | 'v3' | 'v4' | 'v5' | 'v6' | 'v7'>('v4');
  const [namespace, setNamespace] = useState('');
  const [name, setName] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (initialContent && action === "validate") {
      setValidationInput(initialContent);
    }
  }, [initialContent, action]);

  const generateUuid = (version: 'v1' | 'v3' | 'v4' | 'v5' | 'v6' | 'v7', quantity = 1) => {
    const newUuids: GeneratedUuid[] = [];
    
    for (let i = 0; i < quantity; i++) {
      let value: string;
      
      switch (version) {
        case 'v1':
          value = uuidv1();
          break;
        case 'v3':
          if (!namespace || !name) {
            toast({
              title: "Error",
              description: "Namespace and name are required for UUID v3",
              variant: "destructive"
            });
            return;
          }
          value = uuidv3(name, namespace);
          break;
        case 'v4':
          value = uuidv4();
          break;
        case 'v5':
          if (!namespace || !name) {
            toast({
              title: "Error",
              description: "Namespace and name are required for UUID v5",
              variant: "destructive"
            });
            return;
          }
          value = uuidv5(name, namespace);
          break;
        case 'v6':
          // UUID v6 is time-ordered version of v1 (reordered timestamp fields)
          value = generateUuidV6();
          break;
        case 'v7':
          // UUID v7 uses Unix timestamp
          value = generateUuidV7();
          break;
        default:
          value = uuidv4();
      }
      
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

  // Helper function to generate UUID v6 (time-ordered variant of v1)
  const generateUuidV6 = (): string => {
    const v1uuid = uuidv1();
    const parts = v1uuid.split('-');
    // Reorder timestamp fields: time_high-time_mid-time_low-clock_seq-node
    // v1: time_low-time_mid-time_hi_version-clock_seq-node
    // v6: time_hi_version-time_mid-time_low-clock_seq-node (reordered for time-sorting)
    const timeHi = parts[2].substring(0, 3);
    const version = '6';
    const timeMid = parts[1];
    const timeLow = parts[0];
    return `${timeHi}${timeMid.substring(0, 1)}-${timeMid.substring(1)}-${version}${timeLow.substring(1, 4)}-${timeLow.substring(4)}-${parts[3]}-${parts[4]}`;
  };

  // Helper function to generate UUID v7 (Unix timestamp-based)
  const generateUuidV7 = (): string => {
    const timestamp = Date.now();
    const timestampHex = timestamp.toString(16).padStart(12, '0');
    
    // 48 bits timestamp + 4 bits version + 12 bits random
    // 2 bits variant + 62 bits random
    const randomBytes = new Uint8Array(10);
    crypto.getRandomValues(randomBytes);
    
    const version = '7';
    const rand1 = Array.from(randomBytes.slice(0, 2))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    const rand2 = ((randomBytes[2] & 0x3f) | 0x80).toString(16).padStart(2, '0');
    const rand3 = Array.from(randomBytes.slice(3))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return `${timestampHex.substring(0, 8)}-${timestampHex.substring(8, 12)}-${version}${rand1.substring(0, 3)}-${rand2}${rand1.substring(3, 4)}-${rand3}`;
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

  const downloadUuids = () => {
    const allValues = uuids.map(uuid => uuid.value).join('\n');
    const blob = new Blob([allValues], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uuids-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Downloaded!",
      description: `${uuids.length} UUIDs downloaded`,
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
    <Card className="tool-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Hash className="h-5 w-5 text-dev-primary" />
          UUID Generator & Validator/Decoder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="generator" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generator">Generator</TabsTrigger>
            <TabsTrigger value="validator">Validator / Decoder</TabsTrigger>
          </TabsList>

          {/* Generator Tab */}
          <TabsContent value="generator" className="space-y-4 pt-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  UUID Version
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { version: 'v1', label: 'v1', desc: 'Time + MAC' },
                    { version: 'v3', label: 'v3', desc: 'MD5' },
                    { version: 'v4', label: 'v4', desc: 'Random' },
                    { version: 'v5', label: 'v5', desc: 'SHA-1' },
                    { version: 'v6', label: 'v6', desc: 'Time-ordered' },
                    { version: 'v7', label: 'v7', desc: 'Unix Time' },
                  ].map((v) => (
                    <button
                      key={v.version}
                      onClick={() => setSelectedVersion(v.version as any)}
                      className={`p-2 rounded-md border transition-all text-center hover:shadow-sm ${
                        selectedVersion === v.version
                          ? 'border-dev-primary bg-dev-primary/10 text-dev-primary font-medium'
                          : 'border-border/50 bg-muted/20 hover:border-dev-primary/30 text-foreground'
                      }`}
                    >
                      <div className="font-medium text-sm">{v.label}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{v.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {(selectedVersion === 'v3' || selectedVersion === 'v5') && (
                <div className="p-4 bg-muted/20 rounded-lg border border-border/50 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-dev-primary" />
                    <span className="text-sm font-medium text-foreground">Namespace-based UUID Configuration</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">
                      Namespace
                    </label>
                    <div className="flex gap-2 mb-2">
                      {['dns', 'url', 'oid', 'x500'].map((ns) => (
                        <Button
                          key={ns}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const namespaces: Record<string, string> = {
                              'dns': '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
                              'url': '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
                              'oid': '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
                              'x500': '6ba7b814-9dad-11d1-80b4-00c04fd430c8',
                            };
                            setNamespace(namespaces[ns]);
                          }}
                          className={`text-xs ${namespace === '6ba7b810-9dad-11d1-80b4-00c04fd430c8' && ns === 'dns' || 
                                               namespace === '6ba7b811-9dad-11d1-80b4-00c04fd430c8' && ns === 'url' || 
                                               namespace === '6ba7b812-9dad-11d1-80b4-00c04fd430c8' && ns === 'oid' || 
                                               namespace === '6ba7b814-9dad-11d1-80b4-00c04fd430c8' && ns === 'x500' 
                                               ? 'bg-dev-primary/10 border-dev-primary/50' : ''}`}
                        >
                          {ns.toUpperCase()}
                        </Button>
                      ))}
                    </div>
                    <Input
                      placeholder="Or enter custom namespace UUID"
                      value={namespace}
                      onChange={(e) => setNamespace(e.target.value)}
                      className="font-mono bg-muted/50 border-border/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">
                      Name
                    </label>
                    <Input
                      placeholder="e.g., example.com"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-muted/50 border-border/50"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="flex-1 max-w-xs">
                  <label className="block text-sm font-medium mb-2 text-foreground">
                    Quantity
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={count}
                    onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                    className="bg-muted/50 border-border/50"
                  />
                </div>
                <Button
                  onClick={() => generateUuid(selectedVersion, count)}
                  className="bg-dev-primary hover:bg-dev-primary/80 text-dev-primary-foreground w-full sm:w-auto"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generate UUID {selectedVersion}
                </Button>
              </div>
            </div>

            {uuids.length > 0 && (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <label className="text-sm font-medium text-foreground">
                    Generated UUIDs ({uuids.length})
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={copyAllUuids} variant="outline" size="sm">
                      <Copy className="h-4 w-4 mr-1" />
                      Copy All
                    </Button>
                    <Button onClick={downloadUuids} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    <Button onClick={clearAll} variant="outline" size="sm">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2 max-h-[400px] overflow-auto pr-2">
                  {uuids.map((uuid) => {
                    const decoded = uuid.version === 'v1' ? decodeUuidV1(uuid.value) : null;
                    return (
                      <div
                        key={uuid.id}
                        className="p-4 bg-muted/30 rounded-lg border border-border/50 hover:border-dev-primary/30 transition-colors group"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-mono text-sm text-foreground break-all">
                              {uuid.value}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {uuid.version}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {uuid.timestamp}
                              </span>
                            </div>
                            {decoded && (
                              <div className="mt-3 text-xs text-muted-foreground space-y-1">
                                <div><span className="font-medium">Timestamp:</span> {decoded.date.toISOString()}</div>
                                <div><span className="font-medium">Clock Seq:</span> {decoded.clockSeq} • <span className="font-medium">Node:</span> {decoded.node}</div>
                                <div><span className="font-medium">Variant:</span> {decoded.variant}</div>
                              </div>
                            )}
                          </div>
                          
                          <Button
                            onClick={() => copyToClipboard(uuid.value)}
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <div className="p-3 bg-muted/20 rounded-lg border border-border/50 text-xs text-muted-foreground space-y-1">
              <div><strong>UUID v1:</strong> Time-based with MAC address and clock sequence</div>
              <div><strong>UUID v3:</strong> Name-based (MD5 hash) - requires namespace and name</div>
              <div><strong>UUID v4:</strong> Random/pseudo-random generation (most common)</div>
              <div><strong>UUID v5:</strong> Name-based (SHA-1 hash) - requires namespace and name</div>
              <div><strong>UUID v6:</strong> Time-ordered version of v1 (better for database indexing)</div>
              <div><strong>UUID v7:</strong> Unix timestamp-based (newest, sortable)</div>
            </div>
          </TabsContent>

          {/* Validator Tab */}
          <TabsContent value="validator" className="space-y-4 pt-4">
            <div className="flex items-end gap-3">
              <div className="flex-1 max-w-md">
                <label className="block text-sm font-medium mb-2 text-foreground">
                  UUID to Validate
                </label>
                <Input
                  placeholder="e.g., 550e8400-e29b-41d4-a716-446655440000"
                  value={validationInput}
                  onChange={(e) => setValidationInput(e.target.value)}
                  className="font-mono bg-muted/50 border-border/50"
                />
              </div>
              {isValidUuid !== null && (
                <Badge 
                  className={isValidUuid 
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 h-10 px-3" 
                    : "bg-red-500/10 text-red-600 border-red-500/20 h-10 px-3"
                  }
                >
                  {isValidUuid ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Valid
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Invalid
                    </>
                  )}
                </Badge>
              )}
            </div>

            {decodedValidation && (
              <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-foreground">Decoded Information (v1 UUID)</h4>
                  <Button onClick={() => copyDecodedToClipboard(decodedValidation)} size="sm" variant="outline">
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <div className="space-y-2 text-sm font-mono">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Timestamp:</span>
                    <span className="text-foreground">{decodedValidation.date.toISOString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="text-foreground">{decodedValidation.dateString}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Clock Sequence:</span>
                    <span className="text-foreground">{decodedValidation.clockSeq}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Node (MAC):</span>
                    <span className="text-foreground">{decodedValidation.node}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Variant:</span>
                    <span className="text-foreground">{decodedValidation.variant}</span>
                  </div>
                </div>
              </div>
            )}

            {isValidUuid === false && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md border border-destructive/30 text-sm">
                Invalid UUID format. Please enter a valid UUID.
              </div>
            )}

            <div className="p-3 bg-muted/20 rounded-lg border border-border/50 text-xs text-muted-foreground">
              <strong>Note:</strong> Only v1 UUIDs contain decodable timestamp information. v4 UUIDs are randomly generated and cannot be decoded.
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}