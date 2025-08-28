import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Palette, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible";

interface ColorValues {
  hex: string;
  rgb: string;
  rgba: string;
  hsl: string;
  hsla: string;
  hsv: string;
}

interface ColorConverterProps {
  initialContent?: string;
  action?: string;
}

export function ColorConverter({ initialContent, action }: ColorConverterProps) {
  const [inputColor, setInputColor] = useState(initialContent || "#3b82f6");
  const [colorValues, setColorValues] = useState<ColorValues>({
    hex: "#3b82f6",
    rgb: "rgb(59, 130, 246)",
    rgba: "rgba(59, 130, 246, 1)",
    hsl: "hsl(217, 91%, 60%)",
    hsla: "hsla(217, 91%, 60%, 1)",
    hsv: "hsv(217, 76%, 96%)"
  });
  const [error, setError] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (initialContent && action === "convert") {
      convertColor(initialContent);
    }
  }, [initialContent, action]);

  const hexToRgb = (hex: string): [number, number, number] | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : null;
  };

  const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  };

  const rgbToHsv = (r: number, g: number, b: number): [number, number, number] => {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    
    let h = 0;
    const s = max === 0 ? 0 : diff / max;
    const v = max;

    if (diff !== 0) {
      switch (max) {
        case r: h = ((g - b) / diff) % 6; break;
        case g: h = (b - r) / diff + 2; break;
        case b: h = (r - g) / diff + 4; break;
      }
      h /= 6;
    }

    if (h < 0) h += 1;

    return [Math.round(h * 360), Math.round(s * 100), Math.round(v * 100)];
  };

  const convertColor = (input: string) => {
    try {
      setError("");
      let hex = input;
      
      // Handle different input formats
      if (input.startsWith("rgb")) {
        const matches = input.match(/\d+/g);
        if (matches && matches.length >= 3) {
          const [r, g, b] = matches.map(Number);
          hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
        }
      } else if (input.startsWith("hsl")) {
        // Basic HSL to RGB conversion
        const matches = input.match(/\d+/g);
        if (matches && matches.length >= 3) {
          const [h, s, l] = matches.map(Number);
          const rgb = hslToRgb(h, s, l);
          hex = `#${((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1)}`;
        }
      }

      // Ensure hex format
      if (!hex.startsWith("#")) {
        hex = "#" + hex;
      }

      const rgb = hexToRgb(hex);
      if (!rgb) {
        throw new Error("Invalid color format");
      }

      const [r, g, b] = rgb;
      const [h, s, l] = rgbToHsl(r, g, b);
      const [hue, sat, val] = rgbToHsv(r, g, b);

      setColorValues({
        hex: hex.toUpperCase(),
        rgb: `rgb(${r}, ${g}, ${b})`,
        rgba: `rgba(${r}, ${g}, ${b}, 1)`,
        hsl: `hsl(${h}, ${s}%, ${l}%)`,
        hsla: `hsla(${h}, ${s}%, ${l}%, 1)`,
        hsv: `hsv(${hue}, ${sat}%, ${val}%)`
      });
      
      setInputColor(hex);
    } catch (err) {
      setError("Invalid color format. Please use hex, rgb, or hsl format.");
    }
  };

  const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
    h /= 360;
    s /= 100;
    l /= 100;

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  };

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({
        title: "Copied!",
        description: "Colour value copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const generatePalette = () => {
    const rgb = hexToRgb(inputColor);
    if (!rgb) return [];

    const [r, g, b] = rgb;
    const [h, s, l] = rgbToHsl(r, g, b);
    
    const palette = [];
    for (let i = -40; i <= 40; i += 10) {
      const newL = Math.max(0, Math.min(100, l + i));
      const newRgb = hslToRgb(h, s, newL);
      const newHex = `#${((1 << 24) + (newRgb[0] << 16) + (newRgb[1] << 8) + newRgb[2]).toString(16).slice(1)}`.toUpperCase();
      palette.push(newHex);
    }
    
    return palette;
  };

  return (
    <Card className="tool-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Palette className="h-5 w-5 text-dev-primary" />
          Colour Converter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="convert" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="convert">Convert</TabsTrigger>
            <TabsTrigger value="palette">Palette</TabsTrigger>
          </TabsList>
          
          <TabsContent value="convert" className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Colour Input
              </label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={inputColor}
                  onChange={(e) => {
                    setInputColor(e.target.value);
                    convertColor(e.target.value);
                  }}
                  className="w-16 h-10 p-1 bg-muted/50 border-border/50"
                />
                <Input
                  placeholder="Enter hex, rgb, or hsl..."
                  value={inputColor}
                  onChange={(e) => {
                    setInputColor(e.target.value);
                    setTimeout(() => convertColor(e.target.value), 300);
                  }}
                  className="flex-1 font-mono bg-muted/50 border-border/50"
                />
                <Button onClick={() => convertColor(inputColor)}>
                  Convert
                </Button>
              </div>
            </div>

            {error && (
              <div className="text-destructive text-sm font-medium">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <h4 className="text-sm font-semibold text-dev-primary">Color Preview</h4>
              <div
                className="h-24 rounded-md border border-border/50"
                style={{ backgroundColor: colorValues.hex }}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="palette" className="space-y-4">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-dev-primary">Colour Palette</h4>
              <div className="grid grid-cols-5 gap-2">
                {generatePalette().map((color, index) => (
                  <div
                    key={index}
                    className="aspect-square rounded-md border border-border/50 cursor-pointer hover:scale-105 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => copyToClipboard(color)}
                    title={`Click to copy: ${color}`}
                  >
                    <div className="w-full h-full flex items-end justify-center p-1">
                      <span className="text-xs font-mono text-white bg-black/50 px-1 rounded">
                        {color.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-xs text-muted-foreground text-center">
                Click any colour to copy its hex value
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Color Values section moved outside CardContent */}
      <div className="border-t border-border/50 px-6 py-4">
        <Collapsible defaultOpen={false} className="w-full">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-start">
              Examples
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            {Object.entries(colorValues).map(([format, value]) => (
              <div 
                key={format} 
                className="flex items-center justify-between p-2 bg-muted rounded-md"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div 
                    className="w-8 h-8 rounded border border-border/50"
                    style={{ backgroundColor: format === 'hex' ? value : inputColor }}
                  />
                  <div>
                    <div className="text-sm font-medium text-foreground uppercase">
                      {format}
                    </div>
                    <div className="text-sm text-muted-foreground font-mono">
                      {value}
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => copyToClipboard(value)}
                  variant="ghost"
                  size="sm"
                  className="ml-2 flex-shrink-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </Card>
  );
}