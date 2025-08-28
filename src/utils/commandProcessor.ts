
export interface Command {
  tool: string;
  action?: string;
  args?: string[];
}

export interface ToolDefinition {
  id: string;
  name: string;
  aliases: string[];
  actions: string[];
  description: string;
  component: React.ComponentType<{ initialContent?: string; action?: string }>;
}
