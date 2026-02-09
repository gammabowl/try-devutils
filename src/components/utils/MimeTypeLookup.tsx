import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, ArrowRightLeft, FileType, FileSearch } from "lucide-react";
import { useUtilKeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { isTauri } from "@/lib/platform";
import { CopyButton } from "@/components/ui/copy-button";
import { useToast } from "@/hooks/use-toast";

interface MimeTypeEntry {
  extension: string;
  mimeType: string;
  description: string;
  category: string;
}

const mimeTypes: MimeTypeEntry[] = [
  // Text
  { extension: ".txt", mimeType: "text/plain", description: "Plain text file", category: "Text" },
  { extension: ".html", mimeType: "text/html", description: "HyperText Markup Language", category: "Text" },
  { extension: ".htm", mimeType: "text/html", description: "HyperText Markup Language", category: "Text" },
  { extension: ".css", mimeType: "text/css", description: "Cascading Style Sheets", category: "Text" },
  { extension: ".csv", mimeType: "text/csv", description: "Comma-separated values", category: "Text" },
  { extension: ".xml", mimeType: "text/xml", description: "Extensible Markup Language", category: "Text" },
  { extension: ".json", mimeType: "application/json", description: "JavaScript Object Notation", category: "Text" },
  { extension: ".js", mimeType: "application/javascript", description: "JavaScript", category: "Text" },
  { extension: ".jsx", mimeType: "text/jsx", description: "React JSX", category: "Text" },
  { extension: ".ts", mimeType: "application/typescript", description: "TypeScript", category: "Text" },
  { extension: ".tsx", mimeType: "text/tsx", description: "React TypeScript", category: "Text" },
  { extension: ".py", mimeType: "text/x-python", description: "Python", category: "Text" },
  { extension: ".java", mimeType: "text/x-java-source", description: "Java source code", category: "Text" },
  { extension: ".cpp", mimeType: "text/x-c++src", description: "C++ source code", category: "Text" },
  { extension: ".c", mimeType: "text/x-csrc", description: "C source code", category: "Text" },
  { extension: ".php", mimeType: "application/x-php", description: "PHP", category: "Text" },
  { extension: ".rb", mimeType: "text/x-ruby", description: "Ruby", category: "Text" },
  { extension: ".go", mimeType: "text/x-go", description: "Go", category: "Text" },
  { extension: ".rs", mimeType: "text/x-rust", description: "Rust", category: "Text" },
  { extension: ".sh", mimeType: "application/x-shellscript", description: "Shell script", category: "Text" },
  { extension: ".md", mimeType: "text/markdown", description: "Markdown", category: "Text" },
  { extension: ".yaml", mimeType: "application/x-yaml", description: "YAML", category: "Text" },
  { extension: ".yml", mimeType: "application/x-yaml", description: "YAML", category: "Text" },

  // Images
  { extension: ".jpg", mimeType: "image/jpeg", description: "JPEG image", category: "Image" },
  { extension: ".jpeg", mimeType: "image/jpeg", description: "JPEG image", category: "Image" },
  { extension: ".png", mimeType: "image/png", description: "Portable Network Graphics", category: "Image" },
  { extension: ".gif", mimeType: "image/gif", description: "Graphics Interchange Format", category: "Image" },
  { extension: ".bmp", mimeType: "image/bmp", description: "Bitmap image", category: "Image" },
  { extension: ".webp", mimeType: "image/webp", description: "WebP image", category: "Image" },
  { extension: ".svg", mimeType: "image/svg+xml", description: "Scalable Vector Graphics", category: "Image" },
  { extension: ".ico", mimeType: "image/x-icon", description: "Icon image", category: "Image" },
  { extension: ".tiff", mimeType: "image/tiff", description: "Tagged Image File Format", category: "Image" },
  { extension: ".tif", mimeType: "image/tiff", description: "Tagged Image File Format", category: "Image" },

  // Audio
  { extension: ".mp3", mimeType: "audio/mpeg", description: "MPEG audio", category: "Audio" },
  { extension: ".wav", mimeType: "audio/wav", description: "Waveform audio", category: "Audio" },
  { extension: ".ogg", mimeType: "audio/ogg", description: "Ogg audio", category: "Audio" },
  { extension: ".aac", mimeType: "audio/aac", description: "AAC audio", category: "Audio" },
  { extension: ".flac", mimeType: "audio/flac", description: "Free Lossless Audio Codec", category: "Audio" },
  { extension: ".m4a", mimeType: "audio/mp4", description: "MPEG-4 audio", category: "Audio" },

  // Video
  { extension: ".mp4", mimeType: "video/mp4", description: "MPEG-4 video", category: "Video" },
  { extension: ".avi", mimeType: "video/x-msvideo", description: "AVI video", category: "Video" },
  { extension: ".mov", mimeType: "video/quicktime", description: "QuickTime video", category: "Video" },
  { extension: ".wmv", mimeType: "video/x-ms-wmv", description: "Windows Media Video", category: "Video" },
  { extension: ".flv", mimeType: "video/x-flv", description: "Flash video", category: "Video" },
  { extension: ".webm", mimeType: "video/webm", description: "WebM video", category: "Video" },
  { extension: ".mkv", mimeType: "video/x-matroska", description: "Matroska video", category: "Video" },

  // Documents
  { extension: ".pdf", mimeType: "application/pdf", description: "Portable Document Format", category: "Document" },
  { extension: ".doc", mimeType: "application/msword", description: "Microsoft Word", category: "Document" },
  { extension: ".docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", description: "Microsoft Word (OpenXML)", category: "Document" },
  { extension: ".xls", mimeType: "application/vnd.ms-excel", description: "Microsoft Excel", category: "Document" },
  { extension: ".xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", description: "Microsoft Excel (OpenXML)", category: "Document" },
  { extension: ".ppt", mimeType: "application/vnd.ms-powerpoint", description: "Microsoft PowerPoint", category: "Document" },
  { extension: ".pptx", mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation", description: "Microsoft PowerPoint (OpenXML)", category: "Document" },
  { extension: ".rtf", mimeType: "application/rtf", description: "Rich Text Format", category: "Document" },

  // Archives
  { extension: ".zip", mimeType: "application/zip", description: "ZIP archive", category: "Archive" },
  { extension: ".rar", mimeType: "application/x-rar-compressed", description: "RAR archive", category: "Archive" },
  { extension: ".7z", mimeType: "application/x-7z-compressed", description: "7-Zip archive", category: "Archive" },
  { extension: ".tar", mimeType: "application/x-tar", description: "TAR archive", category: "Archive" },
  { extension: ".gz", mimeType: "application/gzip", description: "GZIP compressed", category: "Archive" },

  // Fonts
  { extension: ".ttf", mimeType: "font/ttf", description: "TrueType font", category: "Font" },
  { extension: ".otf", mimeType: "font/otf", description: "OpenType font", category: "Font" },
  { extension: ".woff", mimeType: "font/woff", description: "Web Open Font Format", category: "Font" },
  { extension: ".woff2", mimeType: "font/woff2", description: "Web Open Font Format 2.0", category: "Font" },

  // Other
  { extension: ".exe", mimeType: "application/x-msdownload", description: "Windows executable", category: "Executable" },
  { extension: ".dmg", mimeType: "application/x-apple-diskimage", description: "Apple Disk Image", category: "Executable" },
  { extension: ".deb", mimeType: "application/x-debian-package", description: "Debian package", category: "Executable" },
  { extension: ".rpm", mimeType: "application/x-rpm", description: "RPM package", category: "Executable" },
];

export function MimeTypeLookup() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("browse");
  const { toast } = useToast();

  const categories = ["All", ...Array.from(new Set(mimeTypes.map(type => type.category)))];

  const filteredTypes = useMemo(() => {
    return mimeTypes.filter(type => {
      const matchesSearch = type.extension.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           type.mimeType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           type.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "All" || type.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const lookupByExtension = (ext: string) => {
    const cleanExt = ext.startsWith('.') ? ext : `.${ext}`;
    const found = mimeTypes.find(type => type.extension.toLowerCase() === cleanExt.toLowerCase());
    return found ? `${found.mimeType} - ${found.description}` : "Extension not found";
  };

  const lookupByMimeType = (mime: string) => {
    const found = mimeTypes.find(type => type.mimeType.toLowerCase() === mime.toLowerCase());
    return found ? `${found.extension} - ${found.description}` : "MIME type not found";
  };

  const handleLookup = () => {
    if (!input.trim()) {
      setResult("Please enter a value to lookup");
      return;
    }

    if (activeTab === "extension") {
      setResult(lookupByExtension(input.trim()));
    } else {
      setResult(lookupByMimeType(input.trim()));
    }
  };

  // Keyboard shortcuts
  useUtilKeyboardShortcuts({
    onClear: () => {
      setSearchTerm("");
      setSelectedCategory("All");
      setInput("");
      setResult("");
    },
    onExecute: handleLookup,
  });

  return (
    <Card className="tool-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <FileSearch className="h-5 w-5 text-dev-primary" />
          MIME Type Lookup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="lookup">Quick Lookup</TabsTrigger>
            <TabsTrigger value="extension">By Extension</TabsTrigger>
            <TabsTrigger value="browse">Browse All</TabsTrigger>
          </TabsList>

          {/* Quick Lookup Tab */}
          <TabsContent value="lookup" className="space-y-4 pt-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Enter file extension or MIME type
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., .jpg, .png, text/html, image/jpeg"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                  />
                  <Button onClick={handleLookup}>
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    Lookup
                  </Button>
                </div>
              </div>

              {result && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{result}</span>
                    <CopyButton text={result} />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* By Extension Tab */}
          <TabsContent value="extension" className="space-y-4 pt-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  File Extension
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., jpg, png, html"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                  />
                  <Button onClick={handleLookup}>
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    Get MIME Type
                  </Button>
                </div>
              </div>

              {result && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{result}</span>
                    <CopyButton text={result} />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Browse All Tab */}
          <TabsContent value="browse" className="space-y-4 pt-4">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search MIME types..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Badge
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>

            <div className={`space-y-2 ${isTauri() ? '' : 'max-h-[600px] overflow-y-auto'}`}>
              {filteredTypes.map((type, index) => (
                <Card key={index} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-mono">
                        {type.extension}
                      </Badge>
                      <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="secondary" className="font-mono text-xs">
                        {type.mimeType}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{type.description}</span>
                      <CopyButton text={`${type.extension} → ${type.mimeType}`} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="text-sm text-muted-foreground text-center">
              Showing {filteredTypes.length} of {mimeTypes.length} MIME types
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}