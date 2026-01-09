import { JwtDecoder } from "@/components/tools/JwtDecoder";
import { JsonFormatter } from "@/components/tools/JsonFormatter";
import { UuidGeneratorDecoder } from "@/components/tools/UuidGeneratorDecoder";
import { Base64Converter } from "@/components/tools/Base64Converter";
import { TimestampConverter } from "@/components/tools/TimestampConverter";
import { TextDiff } from "@/components/tools/TextDiff";
import { CronParser } from "@/components/tools/CronParser";
import { ColorConverter } from "@/components/tools/ColorConverter";
import { HashGenerator } from "@/components/tools/HashGenerator";
import { YamlValidator } from "@/components/tools/YamlValidator";
import { StringAnalyser } from "@/components/tools/StringAnalyser";
import { ZlibCompressor } from "@/components/tools/ZlibCompressor";
import { SslCertificateDecoder } from "@/components/tools/SslCertificateDecoder";
import { RegExpTester } from "@/components/tools/RegExpTester";
import { MarkdownPreview } from "@/components/tools/MarkdownPreview";
import {
  FileKeyIcon,
  Braces,
  FingerprintIcon,
  BinaryIcon,
  Clock,
  FileDiffIcon,
  Calendar,
  Palette,
  Hash,
  FileCode,
  FileText,
  Type,
  Zap,
  ShieldCheck,
  Regex,
  LucideIcon,
} from "lucide-react";

export interface Tool {
  id: string;
  label: string;
  icon: LucideIcon;
  component: React.ComponentType<any>;
  description: string;
  color: string;
  textColor: string;
  bgColor: string;
}

export const tools: Tool[] = [
  { id: "base64", label: "Base64 Converter", icon: BinaryIcon, component: Base64Converter, description: "Encode and decode Base64 strings", color: "from-rose-500 to-red-600", textColor: "text-rose-600", bgColor: "bg-rose-500/10" },
  { id: "color", label: "Colour Converter", icon: Palette, component: ColorConverter, description: "Convert between colour formats", color: "from-fuchsia-500 to-pink-600", textColor: "text-fuchsia-600", bgColor: "bg-fuchsia-500/10" },
  { id: "cron", label: "Cron Parser", icon: Calendar, component: CronParser, description: "Parse and explain cron expressions", color: "from-sky-500 to-blue-600", textColor: "text-sky-600", bgColor: "bg-sky-500/10" },
  { id: "hash", label: "Hash Generator", icon: Hash, component: HashGenerator, description: "Generate MD5, SHA1, SHA256 hashes", color: "from-emerald-500 to-green-600", textColor: "text-emerald-600", bgColor: "bg-emerald-500/10" },
  { id: "json", label: "JSON Formatter", icon: Braces, component: JsonFormatter, description: "Format, validate and minify JSON", color: "from-amber-500 to-orange-600", textColor: "text-amber-600", bgColor: "bg-amber-500/10" },
  { id: "jwt", label: "JWT Decoder/Encoder", icon: FileKeyIcon, component: JwtDecoder, description: "Decode, Encode and validate JWT tokens", color: "from-indigo-500 to-indigo-600", textColor: "text-indigo-600", bgColor: "bg-indigo-500/10" },
  { id: "markdown", label: "Markdown", icon: FileText, component: MarkdownPreview, description: "Live preview of markdown", color: "from-orange-500 to-orange-600", textColor: "text-orange-600", bgColor: "bg-orange-500/10" },
  { id: "regex", label: "RegExp Tester", icon: Regex, component: RegExpTester, description: "Test and debug regular expressions", color: "from-blue-500 to-indigo-600", textColor: "text-blue-600", bgColor: "bg-blue-500/10" },
  { id: "ssl", label: "SSL Certificate Decoder", icon: ShieldCheck, component: SslCertificateDecoder, description: "Decode and inspect X.509 certificates", color: "from-green-500 to-emerald-600", textColor: "text-green-600", bgColor: "bg-green-500/10" },
  { id: "string", label: "String Analyser", icon: Type, component: StringAnalyser, description: "Analyse text stats and convert case", color: "from-violet-500 to-purple-600", textColor: "text-violet-600", bgColor: "bg-violet-500/10" },
  { id: "diff", label: "Text Diff", icon: FileDiffIcon, component: TextDiff, description: "Compare texts and find differences", color: "from-red-500 to-red-600", textColor: "text-red-600", bgColor: "bg-red-500/10" },
  { id: "timestamp", label: "Timestamp Converter", icon: Clock, component: TimestampConverter, description: "Convert Unix timestamps to dates", color: "from-teal-500 to-teal-600", textColor: "text-teal-600", bgColor: "bg-teal-500/10" },
  { id: "uuid", label: "UUID Generator/Decoder", icon: FingerprintIcon, component: UuidGeneratorDecoder, description: "Generate, validate, decode UUIDs", color: "from-cyan-500 to-blue-600", textColor: "text-cyan-600", bgColor: "bg-cyan-500/10" },
  { id: "yaml", label: "YAML Validator", icon: FileCode, component: YamlValidator, description: "Validate and convert YAML", color: "from-lime-500 to-lime-600", textColor: "text-lime-600", bgColor: "bg-lime-500/10" },
  { id: "zlib", label: "Zlib Compressor/Decompressor", icon: Zap, component: ZlibCompressor, description: "Compress & decompress (zlib + Base64)", color: "from-stone-500 to-stone-600", textColor: "text-stone-600", bgColor: "bg-stone-500/10" }
];
