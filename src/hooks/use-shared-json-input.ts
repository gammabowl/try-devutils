import { useCallback, useEffect, useState } from "react";

export interface ExampleSignal {
  json: string;
  id: number;
}

interface UseSharedJsonInputOptions {
  exampleSignal: ExampleSignal;
  sharedJson?: string;
  onSharedJsonChange?: (value: string) => void;
  initialValue?: string;
}

export function useSharedJsonInput({
  exampleSignal,
  sharedJson,
  onSharedJsonChange,
  initialValue = "",
}: UseSharedJsonInputOptions) {
  const [input, setInput] = useState(initialValue);

  useEffect(() => {
    if (exampleSignal.id > 0 && exampleSignal.json) {
      setInput(exampleSignal.json);
      onSharedJsonChange?.(exampleSignal.json);
    }
  }, [exampleSignal.id, exampleSignal.json, onSharedJsonChange]);

  useEffect(() => {
    if (sharedJson !== undefined && sharedJson !== input) {
      setInput(sharedJson);
    }
  }, [sharedJson, input]);

  const setInputAndShare = useCallback((value: string) => {
    setInput(value);
    onSharedJsonChange?.(value);
  }, [onSharedJsonChange]);

  return { input, setInput, setInputAndShare };
}
