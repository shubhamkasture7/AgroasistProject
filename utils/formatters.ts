export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

export const getTodayISO = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Attempts to extract and parse the first JSON object/array from a raw model string.
 * Handles fences and common formatting glitches.
 */
export const parseModelJsonOutput = (raw: string): { json?: any; error?: string } => {
  if (!raw || typeof raw !== 'string') return { error: 'No raw text provided' };

  const text = raw.trim();

  // ```json ... ```
  const tripleFenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate1 = tripleFenceMatch ? tripleFenceMatch[1].trim() : null;

  // ` ... `
  const singleFenceMatch = !candidate1 && text.match(/`([^`]+)`/);
  const candidate2 = singleFenceMatch ? singleFenceMatch[1].trim() : null;

  const findFirstJsonSubstring = (s: string): string | null => {
    const startIdx = s.search(/[\{\[]/);
    if (startIdx === -1) return null;
    const opening = s[startIdx];
    const closing = opening === '{' ? '}' : ']';
    let depth = 0;
    for (let i = startIdx; i < s.length; i++) {
      const ch = s[i];
      if (ch === opening) depth++;
      else if (ch === closing) depth--;
      if (depth === 0) return s.slice(startIdx, i + 1);
    }
    return null;
  };

  const tryParse = (s?: string) => {
    if (!s) return { json: undefined, error: 'no-candidate' };
    try {
      const parsed = JSON.parse(s);
      return { json: parsed, error: undefined };
    } catch (e) {
      return { json: undefined, error: (e instanceof Error) ? e.message : String(e) };
    }
  };

  if (candidate1) {
    const r = tryParse(candidate1);
    if (r.json !== undefined) return { json: r.json };
  }
  if (candidate2) {
    const r = tryParse(candidate2);
    if (r.json !== undefined) return { json: r.json };
  }

  const substr = findFirstJsonSubstring(text);
  if (substr) {
    let r = tryParse(substr);
    if (r.json !== undefined) return { json: r.json };

    let repaired = substr.replace(/,\s*([}\]])/g, '$1');
    repaired = repaired.replace(/'([^']*)'/g, '"$1"');

    r = tryParse(repaired);
    if (r.json !== undefined) return { json: r.json };

    const globalBraceStart = text.indexOf('{');
    const globalBraceEnd = text.lastIndexOf('}');
    if (globalBraceStart !== -1 && globalBraceEnd !== -1 && globalBraceEnd > globalBraceStart) {
      const globalSub = text.slice(globalBraceStart, globalBraceEnd + 1)
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/'([^']*)'/g, '"$1"');
      const r2 = tryParse(globalSub);
      if (r2.json !== undefined) return { json: r2.json };
    }

    return { error: `Failed to parse extracted JSON (tried repairs). Last error: ${r.error}` };
  }

  const r = tryParse(text);
  if (r.json !== undefined) return { json: r.json };

  return { error: 'No JSON object/array found in model output' };
};
