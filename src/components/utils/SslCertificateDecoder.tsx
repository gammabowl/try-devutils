import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, AlertCircle, CheckCircle, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUtilKeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { CopyButton } from "@/components/ui/copy-button";

interface SslCertificateDecoderProps {
  initialContent?: string;
  action?: string;
}

interface CertificateInfo {
  version: number;
  serialNumber: string;
  signatureAlgorithm: string;
  issuer: Record<string, string>;
  validity: {
    notBefore: Date;
    notAfter: Date;
  };
  subject: Record<string, string>;
  subjectPublicKeyInfo: {
    algorithm: string;
    keySize?: number;
  };
  subjectAlternativeNames?: string[];
  keyUsage?: string[];
  extendedKeyUsage?: string[];
  extensions?: Record<string, unknown>;
  fingerprints: {
    sha1?: string;
    sha256?: string;
    sha384?: string;
    sha512?: string;
  };
  isExpired?: boolean;
  daysUntilExpiry?: number;
}

export function SslCertificateDecoder({ initialContent, action }: SslCertificateDecoderProps) {
  const [input, setInput] = useState(initialContent || "");
  const [decoded, setDecoded] = useState<CertificateInfo | null>(null);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const examples = [
    {
      desc: "Example PEM Certificate",
      cert: `-----BEGIN CERTIFICATE-----
MIIDdTCCAl2gAwIBAgILBAAAAAABFUtaw5QwDQYJKoZIhvcNAQEFBQAwVzELMAkG
A1UEBhMCQkUxGTAXBgNVBAoTEEdsb2JhbFNpZ24gbnYtc2ExEDAOBgNVBAsTB1Jv
b3QgQ0ExGzAZBgNVBAMTEkdsb2JhbFNpZ24gUm9vdCBDQTAeFw05ODA5MDExMjAw
MDBaFw0yODAxMjgxMjAwMDBaMFcxCzAJBgNVBAYTAkJFMRkwFwYDVQQKExBHbG9i
YWxTaWduIG52LXNhMRAwDgYDVQQLEwdSb290IENBMRswGQYDVQQDExJHbG9iYWxT
aWduIFJvb3QgQ0EwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDaDuaZ
jc6j40+Kfvvxi4Mla+pIH/EqsLmVEQS98GPR4mdmzxzdzxtIK+6NiY6arymAZavp
xy0Sy6scTHAHoT0KMM0VjU/43dSMUBUc71DuxC73/OlS8pF94G3VNTCOXkNz8kHp
1Wrjsok6Vjk4bwY8iGlbKk3Fp1S4bInMm/k8yuX9ifUSPJJ4ltbcdG6TRGHRjcdG
snUOhugZitVtbNV4FpWi6cgKOOvyJBNPc1STE4U6G7weNLWLBYy5d4ux2x8gkasJ
U26Qzns3dLlwR5EiUWMWea6xrkEmCMgZK9FGqkjWZCrXgzT/LCrBbBlDSgeF59N8
9iFo7+ryUp9/k5DPAgMBAAGjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNVHRMBAf8E
BTADAQH/MB0GA1UdDgQWBBRge2YaRQ2XyolQL30EzTSo//z9SzANBgkqhkiG9w0B
AQUFAAOCAQEA1nPnfE920I2/7LqivjTFKDK1fPxsnCwrvQmeU79rXqoRSLblCKOz
yj1hTdNGCbM+w6DjY1Ub8rrvrTnhQ7k4o+YviiY776BQVvnGCv04zcQLcFGUl5gE
38NflNUVyRRBnMRddWQVDf9VMOyGj/8N7yy5Y0b2qvzfvGn9LhJIZJrglfCm7ymP
AbEVtQwdpf5pLGkkeB6zpxxxYu7KyJesF12KwvhHhm4qxFYxldBniYUr+WymXUad
DKqC5JlR3XC321Y9YeRq4VzW9v493kHMB65jUr9TU/Qr6cf9tveCX4XSQRjbgbME
HMUfpIBvFSDJ3gyICh3WZlXi/EjJKSZp4A==
-----END CERTIFICATE-----`
    }
  ];

  const decodeCertificate = async () => {
    try {
      setError("");
      setDecoded(null);

      if (!input.trim()) {
        setError("Please enter a certificate");
        return;
      }

      // Extract PEM content
      const pemMatch = input.match(/-----BEGIN CERTIFICATE-----\s*([\s\S]*?)\s*-----END CERTIFICATE-----/);
      if (!pemMatch) {
        setError("Invalid certificate format. Expected PEM format (-----BEGIN CERTIFICATE-----)");
        return;
      }

      const base64Cert = pemMatch[1].replace(/\s/g, '');
      
      // Decode base64
      const binaryString = atob(base64Cert);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Parse ASN.1 DER encoded certificate
      const certInfo = parseX509Certificate(bytes);
      
      // Calculate fingerprints
      const calculateFingerprints = async (certBytes: Uint8Array) => {
        const hashBuffer = async (algorithm: string) => {
          const hash = await crypto.subtle.digest(algorithm, certBytes);
          return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join(':')
            .toUpperCase();
        };

        return {
          sha1: await hashBuffer('SHA-1'),
          sha256: await hashBuffer('SHA-256'),
          sha384: await hashBuffer('SHA-384'),
          sha512: await hashBuffer('SHA-512'),
        };
      };

      const fingerprints = await calculateFingerprints(bytes);
      certInfo.fingerprints = fingerprints;

      // Calculate expiry status
      const now = new Date();
      certInfo.isExpired = now > certInfo.validity.notAfter;
      certInfo.daysUntilExpiry = Math.floor((certInfo.validity.notAfter.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      setDecoded(certInfo);

      toast({
        title: "Success!",
        description: "Certificate decoded successfully",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to decode certificate");
      setDecoded(null);
    }
  };

  const parseSubjectAlternativeNames = (bytes: Uint8Array): string[] => {
    const names: string[] = [];
    let pos = 0;

    const readTag = (): { tag: number; length: number } => {
      const tag = bytes[pos++];
      let length = bytes[pos++];
      if (length & 0x80) {
        const lenBytes = length & 0x7f;
        length = 0;
        for (let i = 0; i < lenBytes; i++) {
          length = (length << 8) | bytes[pos++];
        }
      }
      return { tag, length };
    };

    const skip = (length: number) => {
      pos += length;
    };

    try {
      const seqTag = readTag();
      const end = pos + seqTag.length;

      while (pos < end) {
        const nameTag = readTag();
        const nameEnd = pos + nameTag.length;

        if (nameTag.tag === 0x82) { // dNSName [2]
          const nameBytes = bytes.slice(pos, pos + nameTag.length);
          names.push(new TextDecoder().decode(nameBytes));
        } else if (nameTag.tag === 0x87) { // iPAddress [7]
          const ipBytes = bytes.slice(pos, pos + nameTag.length);
          if (ipBytes.length === 4) {
            names.push(Array.from(ipBytes).join('.'));
          } else if (ipBytes.length === 16) {
            // IPv6 - convert to colon notation
            const ipv6 = [];
            for (let i = 0; i < 16; i += 2) {
              ipv6.push(((ipBytes[i] << 8) | ipBytes[i + 1]).toString(16));
            }
            names.push(ipv6.join(':'));
          }
        } else if (nameTag.tag === 0x81) { // rfc822Name [1]
          const emailBytes = bytes.slice(pos, pos + nameTag.length);
          names.push(new TextDecoder().decode(emailBytes));
        }

        skip(nameTag.length);
      }
    } catch (e) {
      console.warn('Failed to parse SAN:', e);
    }

    return names;
  };

  const parseKeyUsage = (bytes: Uint8Array): string[] => {
    const usages: string[] = [];
    if (bytes.length === 0) return usages;

    const usageBits = bytes[0];
    const keyUsageMap = [
      'digitalSignature',
      'nonRepudiation',
      'keyEncipherment',
      'dataEncipherment',
      'keyAgreement',
      'keyCertSign',
      'crlSign',
      'encipherOnly',
      'decipherOnly'
    ];

    for (let i = 0; i < Math.min(keyUsageMap.length, 8); i++) {
      if (usageBits & (1 << i)) {
        usages.push(keyUsageMap[i]);
      }
    }

    return usages;
  };

  const parseExtendedKeyUsage = (bytes: Uint8Array): string[] => {
    const usages: string[] = [];
    let pos = 0;

    const readTag = (): { tag: number; length: number } => {
      const tag = bytes[pos++];
      let length = bytes[pos++];
      if (length & 0x80) {
        const lenBytes = length & 0x7f;
        length = 0;
        for (let i = 0; i < lenBytes; i++) {
          length = (length << 8) | bytes[pos++];
        }
      }
      return { tag, length };
    };

    const readOID = (length: number): string => {
      const oidBytes = bytes.slice(pos, pos + length);
      pos += length;
      return oidBytes.map(b => b.toString()).join('.');
    };

    try {
      const seqTag = readTag();
      const end = pos + seqTag.length;

      while (pos < end) {
        const oidTag = readTag();
        const oid = readOID(oidTag.length);

        const ekuMap: { [key: string]: string } = {
          '1.3.6.1.5.5.7.3.1': 'serverAuth',
          '1.3.6.1.5.5.7.3.2': 'clientAuth',
          '1.3.6.1.5.5.7.3.3': 'codeSigning',
          '1.3.6.1.5.5.7.3.4': 'emailProtection',
          '1.3.6.1.5.5.7.3.5': 'ipsecEndSystem',
          '1.3.6.1.5.5.7.3.6': 'ipsecTunnel',
          '1.3.6.1.5.5.7.3.7': 'ipsecUser',
          '1.3.6.1.5.5.7.3.8': 'timeStamping',
          '1.3.6.1.5.5.7.3.9': 'ocspSigning',
          '1.3.6.1.4.1.311.10.3.3': 'msCodeInd',
          '1.3.6.1.4.1.311.10.3.4': 'msCodeTreatAsSafe',
          '1.3.6.1.4.1.311.10.3.5': 'msCTLSign',
          '1.3.6.1.4.1.311.10.3.6': 'msSGC',
          '1.3.6.1.4.1.311.10.3.7': 'msNT5Crypto',
          '1.3.6.1.4.1.311.10.3.8': 'msNT5Crypto',
          '1.3.6.1.4.1.311.10.3.9': 'msNT5Crypto',
          '1.3.6.1.4.1.311.10.3.10': 'msNT5Crypto',
          '1.3.6.1.4.1.311.10.3.11': 'msNT5Crypto',
          '1.3.6.1.4.1.311.10.3.12': 'msNT5Crypto',
          '1.3.6.1.4.1.311.10.3.13': 'msNT5Crypto'
        };

        usages.push(ekuMap[oid] || oid);
      }
    } catch (e) {
      console.warn('Failed to parse EKU:', e);
    }

    return usages;
  };

  const parseX509Certificate = (bytes: Uint8Array): CertificateInfo => {
    let pos = 0;

    // Helper functions for ASN.1 parsing
    const readLength = (): number => {
      if (pos >= bytes.length) throw new Error("Unexpected end of data");
      let len = bytes[pos++];
      if (len & 0x80) {
        const numBytes = len & 0x7f;
        if (numBytes > 4) throw new Error("Length encoding too long");
        len = 0;
        for (let i = 0; i < numBytes; i++) {
          if (pos >= bytes.length) throw new Error("Unexpected end of data");
          len = (len << 8) | bytes[pos++];
        }
      }
      return len;
    };

    const readTag = (): { tag: number; length: number } => {
      if (pos >= bytes.length) throw new Error("Unexpected end of data");
      const tag = bytes[pos++];
      const length = readLength();
      return { tag, length };
    };

    const skip = (length: number): void => {
      pos += length;
      if (pos > bytes.length) throw new Error("Skip beyond end of data");
    };

    const readOID = (length: number): string => {
      const oid: number[] = [];
      const end = pos + length;
      
      if (pos < end) {
        const first = bytes[pos++];
        oid.push(Math.floor(first / 40));
        oid.push(first % 40);
      }

      while (pos < end) {
        let value = 0;
        let byte;
        do {
          if (pos >= bytes.length) throw new Error("Unexpected end of data in OID");
          byte = bytes[pos++];
          value = (value << 7) | (byte & 0x7f);
        } while (byte & 0x80);
        oid.push(value);
      }

      return oid.join('.');
    };

    const readString = (length: number): string => {
      let str = '';
      for (let i = 0; i < length; i++) {
        if (pos >= bytes.length) throw new Error("Unexpected end of data in string");
        const byte = bytes[pos++];
        if (byte >= 32 && byte <= 126) {
          str += String.fromCharCode(byte);
        } else if (byte === 0) {
          // null byte, skip
        } else {
          str += String.fromCharCode(byte); // include all characters
        }
      }
      return str;
    };

    const readInteger = (length: number): string => {
      let hex = '';
      for (let i = 0; i < length; i++) {
        if (pos >= bytes.length) throw new Error("Unexpected end of data in integer");
        hex += bytes[pos++].toString(16).padStart(2, '0');
      }
      return hex;
    };

    const readTime = (tag: number, length: number): Date => {
      const timeStr = readString(length);
      // UTCTime (tag 0x17) format: YYMMDDHHMMSSZ or YYMMDDHHMMSS+HHMM
      // GeneralizedTime (tag 0x18) format: YYYYMMDDHHMMSSZ
      
      if (tag === 0x17 && (length === 13 || length === 15)) {
        // UTCTime
        const year = parseInt(timeStr.substring(0, 2));
        const fullYear = year >= 50 ? 1900 + year : 2000 + year;
        return new Date(Date.UTC(
          fullYear,
          parseInt(timeStr.substring(2, 4)) - 1,
          parseInt(timeStr.substring(4, 6)),
          parseInt(timeStr.substring(6, 8)),
          parseInt(timeStr.substring(8, 10)),
          parseInt(timeStr.substring(10, 12))
        ));
      } else if (tag === 0x18 && length >= 15) {
        // GeneralizedTime
        return new Date(Date.UTC(
          parseInt(timeStr.substring(0, 4)),
          parseInt(timeStr.substring(4, 6)) - 1,
          parseInt(timeStr.substring(6, 8)),
          parseInt(timeStr.substring(8, 10)),
          parseInt(timeStr.substring(10, 12)),
          parseInt(timeStr.substring(12, 14))
        ));
      } else {
        throw new Error(`Unsupported time format: tag=${tag.toString(16)}, length=${length}`);
      }
    };

    const parseName = (): Record<string, string> => {
      const name: Record<string, string> = {};
      const { tag, length } = readTag(); // SEQUENCE
      const end = pos + length;

      while (pos < end) {
        try {
          readTag(); // SET
          readTag(); // SEQUENCE
          const oidInfo = readTag(); // OID
          if (oidInfo.tag !== 0x06) {
            skip(oidInfo.length);
            continue;
          }
          const oid = readOID(oidInfo.length);
          const strInfo = readTag();
          const value = readString(strInfo.length);

          // Map common OIDs to readable names
          const oidMap: Record<string, string> = {
            '2.5.4.3': 'CN',
            '2.5.4.6': 'C',
            '2.5.4.7': 'L',
            '2.5.4.8': 'ST',
            '2.5.4.10': 'O',
            '2.5.4.11': 'OU',
            '2.5.4.5': 'SN',
          };
          
          const key = oidMap[oid] || oid;
          name[key] = value;
        } catch (e) {
          // Skip malformed attributes
          if (pos < end) pos = end;
          break;
        }
      }

      return name;
    };

    try {
      // Start parsing
      readTag(); // Certificate SEQUENCE
      const tbsInfo = readTag(); // TBSCertificate SEQUENCE
      const tbsEnd = pos + tbsInfo.length;

      // Version (optional, default v1)
      let version = 1;
      if (pos < bytes.length && bytes[pos] === 0xa0) {
        readTag(); // [0] EXPLICIT
        const versionInfo = readTag(); // INTEGER
        version = bytes[pos++] + 1;
      }

      // Serial Number
      const serialInfo = readTag();
      if (serialInfo.tag !== 0x02) throw new Error("Expected INTEGER for serial number");
      const serialNumber = readInteger(serialInfo.length);

      // Signature Algorithm
      const sigAlgInfo = readTag(); // SEQUENCE
      const sigAlgEnd = pos + sigAlgInfo.length;
      const sigOidInfo = readTag();
      const signatureOid = readOID(sigOidInfo.length);
      pos = sigAlgEnd; // Skip any parameters

      const sigMap: Record<string, string> = {
        '1.2.840.113549.1.1.5': 'SHA1-RSA',
        '1.2.840.113549.1.1.11': 'SHA256-RSA',
        '1.2.840.113549.1.1.12': 'SHA384-RSA',
        '1.2.840.113549.1.1.13': 'SHA512-RSA',
        '1.2.840.10045.4.3.2': 'ECDSA-SHA256',
        '1.2.840.10045.4.3.3': 'ECDSA-SHA384',
        '1.2.840.10045.4.3.4': 'ECDSA-SHA512',
      };
      const signatureAlgorithm = sigMap[signatureOid] || signatureOid;

      // Issuer
      const issuer = parseName();

      // Validity
      readTag(); // SEQUENCE
      const notBeforeInfo = readTag();
      const notBefore = readTime(notBeforeInfo.tag, notBeforeInfo.length);
      const notAfterInfo = readTag();
      const notAfter = readTime(notAfterInfo.tag, notAfterInfo.length);

      // Subject
      const subject = parseName();

      // Subject Public Key Info
      const spkiInfo = readTag(); // SEQUENCE
      const spkiEnd = pos + spkiInfo.length;
      const algInfo = readTag(); // SEQUENCE (algorithm)
      const algEnd = pos + algInfo.length;
      const pkOidInfo = readTag();
      const pkOid = readOID(pkOidInfo.length);
      
      const pkMap: Record<string, string> = {
        '1.2.840.113549.1.1.1': 'RSA',
        '1.2.840.10045.2.1': 'EC',
        '1.2.840.10040.4.1': 'DSA',
        '1.3.101.110': 'X25519',
        '1.3.101.112': 'Ed25519',
      };
      const keyAlgorithm = pkMap[pkOid] || pkOid;

      // Parse extensions if present
      let subjectAlternativeNames: string[] = [];
      let keyUsage: string[] = [];
      let extendedKeyUsage: string[] = [];

      try {
        // Skip to extensions (if present)
        while (pos < bytes.length) {
          const tag = bytes[pos];
          if (tag === 0xa3) { // [3] EXPLICIT extensions
            readTag(); // Skip the [3] tag
            const extensionsTag = readTag(); // SEQUENCE of extensions
            const extensionsEnd = pos + extensionsTag.length;

            while (pos < extensionsEnd) {
              const extTag = readTag(); // SEQUENCE for each extension
              const extEnd = pos + extTag.length;

              const oidTag = readTag(); // OID
              const oid = readOID(oidTag.length);

              const criticalTag = readTag(); // BOOLEAN (critical flag)
              const isCritical = bytes[pos - 1] !== 0; // Last byte of BOOLEAN

              const valueTag = readTag(); // OCTET STRING
              const valueStart = pos;
              skip(valueTag.length);
              const valueBytes = bytes.slice(valueStart, pos);

              // Parse specific extensions
              if (oid === '2.5.29.17') { // subjectAltName
                subjectAlternativeNames = parseSubjectAlternativeNames(valueBytes);
              } else if (oid === '2.5.29.15') { // keyUsage
                keyUsage = parseKeyUsage(valueBytes);
              } else if (oid === '2.5.29.37') { // extKeyUsage
                extendedKeyUsage = parseExtendedKeyUsage(valueBytes);
              }
            }
            break;
          } else {
            // Skip other optional fields
            const skipTag = readTag();
            skip(skipTag.length);
          }
        }
      } catch (e) {
        // Extensions parsing failed, continue without them
        console.warn('Failed to parse extensions:', e);
      }

      return {
        version,
        serialNumber: serialNumber.toUpperCase(),
        signatureAlgorithm,
        issuer,
        validity: {
          notBefore,
          notAfter,
        },
        subject,
        subjectPublicKeyInfo: {
          algorithm: keyAlgorithm,
        },
        subjectAlternativeNames,
        keyUsage,
        extendedKeyUsage,
        fingerprints: {},
      };
    } catch (e) {
      throw new Error(`Certificate parsing failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const copyToClipboard = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Copied to clipboard",
    });
  }, [toast]);

  const clearAll = useCallback(() => {
    setInput("");
    setDecoded(null);
    setError("");
  }, []);

  useUtilKeyboardShortcuts({
    onExecute: decodeCertificate,
    onClear: clearAll,
    onCopy: () => {
      if (decoded) copyToClipboard(JSON.stringify(decoded, null, 2));
    }
  });

  const formatDate = (date: Date): string => {
    return date.toISOString();
  };

  const isExpired = decoded ? new Date() > decoded.validity.notAfter : false;
  const isNotYetValid = decoded ? new Date() < decoded.validity.notBefore : false;

  return (
    <Card className="tool-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <ShieldCheck className="h-5 w-5 text-dev-primary" />
          SSL Certificate Decoder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-foreground">
              Certificate (PEM format)
            </label>
            {examples.map((example, idx) => (
              <Button
                key={idx}
                variant="ghost"
                size="sm"
                onClick={() => setInput(example.cert)}
                className="text-xs"
              >
                <FileText className="h-3 w-3 mr-1" />
                {example.desc}
              </Button>
            ))}
          </div>
          <Textarea
            placeholder="Paste your SSL certificate here (including -----BEGIN CERTIFICATE----- and -----END CERTIFICATE-----)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="font-mono text-sm bg-muted/50 border-border/50 min-h-[200px]"
          />
        </div>

        <Button
          onClick={decodeCertificate}
          className="w-full bg-dev-primary hover:bg-dev-primary/80 text-dev-primary-foreground"
        >
          Decode Certificate
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {decoded && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                <CheckCircle className="h-3 w-3 mr-1" />
                Decoded Successfully
              </Badge>
              {isExpired && (
                <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
                  Expired
                </Badge>
              )}
              {isNotYetValid && (
                <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                  Not Yet Valid
                </Badge>
              )}
              {!isExpired && !isNotYetValid && (
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                  Valid
                </Badge>
              )}
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                <h4 className="text-sm font-semibold mb-3 text-foreground">Certificate Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                    <span className="text-muted-foreground">Version:</span>
                    <span className="text-foreground font-mono">v{decoded.version}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                    <span className="text-muted-foreground">Serial Number:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-foreground font-mono text-sm break-all">{decoded.serialNumber}</span>
                      <CopyButton
                        text={decoded.serialNumber}
                        className="flex-shrink-0"
                        title="Copy serial number"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                    <span className="text-muted-foreground">Signature Alg:</span>
                    <span className="text-foreground font-mono">{decoded.signatureAlgorithm}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                <h4 className="text-sm font-semibold mb-3 text-foreground">Subject</h4>
                <div className="space-y-2 text-sm">
                  {Object.entries(decoded.subject).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-[80px_1fr] gap-2">
                      <span className="text-muted-foreground font-mono">{key}:</span>
                      <span className="text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                <h4 className="text-sm font-semibold mb-3 text-foreground">Issuer</h4>
                <div className="space-y-2 text-sm">
                  {Object.entries(decoded.issuer).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-[80px_1fr] gap-2">
                      <span className="text-muted-foreground font-mono">{key}:</span>
                      <span className="text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                <h4 className="text-sm font-semibold mb-3 text-foreground">Validity Period</h4>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                    <span className="text-muted-foreground">Not Before:</span>
                    <span className="text-foreground font-mono">{formatDate(decoded.validity.notBefore)}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                    <span className="text-muted-foreground">Not After:</span>
                    <span className="text-foreground font-mono">{formatDate(decoded.validity.notAfter)}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                    <span className="text-muted-foreground">Status:</span>
                    <div className="flex items-center gap-2">
                      {isExpired ? (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Expired
                        </Badge>
                      ) : isNotYetValid ? (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Not Yet Valid
                        </Badge>
                      ) : (
                        <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <CheckCircle className="h-3 w-3" />
                          Valid
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                    <span className="text-muted-foreground">Days Remaining:</span>
                    <span className="text-foreground font-mono">
                      {Math.max(0, Math.floor((decoded.validity.notAfter.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                <h4 className="text-sm font-semibold mb-3 text-foreground">Public Key</h4>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                    <span className="text-muted-foreground">Algorithm:</span>
                    <span className="text-foreground font-mono">{decoded.subjectPublicKeyInfo.algorithm}</span>
                  </div>
                  {decoded.subjectPublicKeyInfo.keySize && (
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <span className="text-muted-foreground">Key Size:</span>
                      <span className="text-foreground font-mono">{decoded.subjectPublicKeyInfo.keySize} bits</span>
                    </div>
                  )}
                </div>
              </div>

              {decoded.subjectAlternativeNames && decoded.subjectAlternativeNames.length > 0 && (
                <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                  <h4 className="text-sm font-semibold mb-3 text-foreground">Subject Alternative Names</h4>
                  <div className="flex flex-wrap gap-2">
                    {decoded.subjectAlternativeNames.map((name, idx) => (
                      <Badge key={idx} variant="outline" className="font-mono text-xs">
                        {name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {decoded.keyUsage && decoded.keyUsage.length > 0 && (
                <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                  <h4 className="text-sm font-semibold mb-3 text-foreground">Key Usage</h4>
                  <div className="flex flex-wrap gap-2">
                    {decoded.keyUsage.map((usage, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {usage}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {decoded.extendedKeyUsage && decoded.extendedKeyUsage.length > 0 && (
                <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                  <h4 className="text-sm font-semibold mb-3 text-foreground">Extended Key Usage</h4>
                  <div className="flex flex-wrap gap-2">
                    {decoded.extendedKeyUsage.map((usage, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {usage}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                <h4 className="text-sm font-semibold mb-3 text-foreground">Certificate Fingerprints</h4>
                <div className="space-y-2 text-sm">
                  {decoded.fingerprints.sha1 && (
                    <div className="grid grid-cols-[80px_1fr_auto] gap-2 items-center">
                      <span className="text-muted-foreground">SHA-1:</span>
                      <span className="text-foreground font-mono text-xs break-all">{decoded.fingerprints.sha1}</span>
                      <CopyButton
                        text={decoded.fingerprints.sha1}
                        className="flex-shrink-0"
                        title="Copy SHA-1 fingerprint"
                      />
                    </div>
                  )}
                  {decoded.fingerprints.sha256 && (
                    <div className="grid grid-cols-[80px_1fr_auto] gap-2 items-center">
                      <span className="text-muted-foreground">SHA-256:</span>
                      <span className="text-foreground font-mono text-xs break-all">{decoded.fingerprints.sha256}</span>
                      <CopyButton
                        text={decoded.fingerprints.sha256}
                        className="flex-shrink-0"
                        title="Copy SHA-256 fingerprint"
                      />
                    </div>
                  )}
                  {decoded.fingerprints.sha384 && (
                    <div className="grid grid-cols-[80px_1fr_auto] gap-2 items-center">
                      <span className="text-muted-foreground">SHA-384:</span>
                      <span className="text-foreground font-mono text-xs break-all">{decoded.fingerprints.sha384}</span>
                      <CopyButton
                        text={decoded.fingerprints.sha384}
                        className="flex-shrink-0"
                        title="Copy SHA-384 fingerprint"
                      />
                    </div>
                  )}
                  {decoded.fingerprints.sha512 && (
                    <div className="grid grid-cols-[80px_1fr_auto] gap-2 items-center">
                      <span className="text-muted-foreground">SHA-512:</span>
                      <span className="text-foreground font-mono text-xs break-all">{decoded.fingerprints.sha512}</span>
                      <CopyButton
                        text={decoded.fingerprints.sha512}
                        className="flex-shrink-0"
                        title="Copy SHA-512 fingerprint"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="p-3 bg-muted/20 rounded-lg border border-border/50 text-sm text-muted-foreground">
          <strong>Note:</strong> This decoder parses X.509 certificates in PEM format. Paste the entire certificate including the BEGIN and END markers.
        </div>
      </CardContent>
    </Card>
  );
}
