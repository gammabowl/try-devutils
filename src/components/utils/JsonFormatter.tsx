import { JsonLinter } from "@/components/JsonLinter";

interface JsonFormatterProps {
  initialContent?: string;
  action?: string;
}

export function JsonFormatter({ initialContent, action }: JsonFormatterProps) {
  return <JsonLinter initialContent={initialContent} action={action} />;
}
