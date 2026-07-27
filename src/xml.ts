/**
 * Minimal XML parser for WHMCS API responses.
 *
 * WHMCS can fail to encode a JSON response when any record holds bytes that are
 * not valid UTF-8 ("Error generating JSON encoded response: Malformed UTF-8
 * characters"). The same request served as XML succeeds, so the client retries
 * in XML and parses it here. The WHMCS XML dialect is flat and predictable —
 * no attributes worth keeping, no namespaces, no mixed content — so a small
 * hand-rolled parser avoids adding a dependency.
 */

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity: string) => {
    if (entity.startsWith('#x') || entity.startsWith('#X')) {
      const code = Number.parseInt(entity.slice(2), 16);
      return Number.isNaN(code) ? match : String.fromCodePoint(code);
    }
    if (entity.startsWith('#')) {
      const code = Number.parseInt(entity.slice(1), 10);
      return Number.isNaN(code) ? match : String.fromCodePoint(code);
    }
    const named = ENTITIES[entity.toLowerCase()];
    return named ?? match;
  });
}

/**
 * WHMCS renders collections as `<products><product>..</product>..</products>`.
 * A single-item collection would otherwise parse to a bare object instead of an
 * array, so a plural parent always yields an array for its singular child.
 */
function isCollection(parentName: string, childName: string): boolean {
  return (
    parentName === `${childName}s` ||
    parentName === `${childName}es` ||
    parentName === childName.replace(/y$/, 'ies')
  );
}

type XmlValue = string | XmlNode | XmlValue[];
type XmlNode = { [key: string]: XmlValue };

type Frame = {
  name: string;
  node: XmlNode;
  text: string[];
  hasChildren: boolean;
};

function appendChild(frame: Frame, name: string, value: XmlValue): void {
  const { node } = frame;

  if (!(name in node)) {
    node[name] = isCollection(frame.name, name) ? [value] : value;
    return;
  }

  const existing = node[name];
  if (Array.isArray(existing)) {
    existing.push(value);
    return;
  }
  node[name] = [existing, value];
}

function closeFrame(frame: Frame): XmlValue {
  if (frame.hasChildren) {
    return frame.node;
  }
  return frame.text.join('').trim();
}

// Matches, in order: CDATA, closing tag, opening/self-closing tag, prolog,
// comment, doctype. Everything else is character data.
const TOKEN =
  /<!\[CDATA\[([\s\S]*?)\]\]>|<\/([A-Za-z_][\w.:-]*)\s*>|<([A-Za-z_][\w.:-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>|<\?[\s\S]*?\?>|<!--[\s\S]*?-->|<![^>]*>/g;

/**
 * Parses a WHMCS XML API response into the same shape the JSON response uses,
 * so callers can treat both interchangeably.
 */
export function parseWhmcsXml(xml: string): Record<string, unknown> {
  const root: Frame = { name: '#root', node: {}, text: [], hasChildren: false };
  const stack: Frame[] = [root];

  TOKEN.lastIndex = 0;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = TOKEN.exec(xml)) !== null) {
    const top = stack[stack.length - 1];

    if (match.index > cursor) {
      top.text.push(decodeEntities(xml.slice(cursor, match.index)));
    }
    cursor = match.index + match[0].length;

    const [, cdata, closeName, openName, attrs] = match;

    if (cdata !== undefined) {
      top.text.push(cdata);
      continue;
    }

    if (closeName !== undefined) {
      // Ignore a stray close tag that does not match the open frame.
      if (stack.length > 1 && top.name === closeName) {
        stack.pop();
        appendChild(stack[stack.length - 1], closeName, closeFrame(top));
      }
      continue;
    }

    if (openName !== undefined) {
      top.hasChildren = true;
      if (attrs.trimEnd().endsWith('/')) {
        appendChild(top, openName, '');
        continue;
      }
      stack.push({ name: openName, node: {}, text: [], hasChildren: false });
    }
  }

  // Unclosed frames (truncated response) still contribute what they collected.
  while (stack.length > 1) {
    const frame = stack.pop() as Frame;
    appendChild(stack[stack.length - 1], frame.name, closeFrame(frame));
  }

  const body = root.node.whmcsapi;
  const parsed = body !== undefined && typeof body === 'object' && !Array.isArray(body) ? body : root.node;

  if (!Object.keys(parsed).length) {
    throw new Error(`Unexpected WHMCS XML response: ${xml.slice(0, 200)}`);
  }

  return parsed as Record<string, unknown>;
}

/**
 * True when the JSON encoder on the WHMCS side blew up on non-UTF-8 bytes.
 * Retrying the same call as XML is the workaround.
 */
export function isJsonEncodingError(message: unknown): boolean {
  if (typeof message !== 'string') return false;
  return /error generating json encoded response/i.test(message) || /malformed utf-8/i.test(message);
}
