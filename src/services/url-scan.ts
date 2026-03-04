/**
 * Represents the risk assessment of a URL.
 */
export interface UrlRiskAssessment {
  /**
   * Indicates whether the URL is considered safe.
   */
  isSafe: boolean;
  /**
   * An array of reasons why the URL might be risky.
   */
  riskReasons: string[];
  /**
   * Confidence score for the risk assessment (e.g., 80% risk of phishing).
   */
  confidenceScore: number;
}

/** Known URL shortening services that hide the final destination. */
const URL_SHORTENERS = new Set([
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd',
  'buff.ly', 'rebrand.ly', 'short.link', 'cutt.ly', 'rb.gy',
  'tiny.cc', 'shorte.st', 'clck.ru', 'su.pr', 'snip.ly',
]);

/** Well-known brand domains to detect typosquatting. */
const KNOWN_BRANDS: { brand: string; official: string[] }[] = [
  { brand: 'google', official: ['google.com', 'google.co', 'googleapis.com', 'googlevideo.com'] },
  { brand: 'amazon', official: ['amazon.com', 'amazon.co', 'amazonaws.com', 'amzn.com'] },
  { brand: 'apple', official: ['apple.com', 'icloud.com', 'itunes.com'] },
  { brand: 'microsoft', official: ['microsoft.com', 'microsoftonline.com', 'live.com', 'outlook.com', 'azure.com'] },
  { brand: 'facebook', official: ['facebook.com', 'fb.com', 'fbcdn.net', 'instagram.com'] },
  { brand: 'paypal', official: ['paypal.com', 'paypalobjects.com'] },
  { brand: 'netflix', official: ['netflix.com', 'nflxvideo.net', 'nflximg.net'] },
  { brand: 'twitter', official: ['twitter.com', 'x.com', 'twimg.com'] },
  { brand: 'linkedin', official: ['linkedin.com', 'licdn.com'] },
  { brand: 'dropbox', official: ['dropbox.com', 'dropboxstatic.com'] },
  { brand: 'chase', official: ['chase.com', 'jpmorgan.com'] },
  { brand: 'wellsfargo', official: ['wellsfargo.com'] },
  { brand: 'bankofamerica', official: ['bankofamerica.com', 'bofa.com'] },
];

/** Keywords commonly abused in phishing paths/queries. */
const PHISHING_KEYWORDS = [
  'verify', 'validation', 'confirm', 'update', 'secure', 'reset',
  'recover', 'suspend', 'unlock', 'reactivate', 'unusual-activity',
  'signin', 'sign-in', 'log-in', 'login', 'credential',
  'billing', 'invoice', 'refund', 'support-ticket',
];

/**
 * Performs a heuristic analysis of a URL to detect potential security risks.
 * This provides a deterministic baseline score before any AI enrichment.
 *
 * @param url The URL to analyze.
 * @returns A promise that resolves to a UrlRiskAssessment object.
 */
export async function analyzeUrl(url: string): Promise<UrlRiskAssessment> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return { isSafe: false, riskReasons: ['Malformed or unparseable URL'], confidenceScore: 60 };
  }

  const riskReasons: string[] = [];
  let score = 0;

  const { hostname, protocol, port, pathname, search, href } = parsedUrl;
  const lowerHref = href.toLowerCase();
  const lowerHostname = hostname.toLowerCase();
  const lowerPath = (pathname + search).toLowerCase();

  // 1. Protocol check
  if (protocol === 'http:') {
    riskReasons.push('Unencrypted HTTP connection (no HTTPS) — data may be intercepted');
    score += 20;
  }

  // 2. IP address as hostname (common in phishing and malware hosting)
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(hostname)) {
    riskReasons.push('IP address used as hostname instead of a domain name');
    score += 40;
  }

  // 3. Known URL shortener (hides final destination)
  // Check all possible trailing domain segments (handles multi-part TLDs like co.uk gracefully by
  // checking both the last-2 and last-3 labels, and the full hostname).
  const labels = hostname.split('.');
  const apex2 = labels.slice(-2).join('.');
  const apex3 = labels.length >= 3 ? labels.slice(-3).join('.') : '';
  if (URL_SHORTENERS.has(hostname) || URL_SHORTENERS.has(apex2) || URL_SHORTENERS.has(apex3)) {
    riskReasons.push('URL shortener detected — the final destination is hidden and unverifiable');
    score += 30;
  }

  // 4. Unusual port
  if (port && port !== '80' && port !== '443') {
    riskReasons.push(`Non-standard port (${port}) — legitimate sites rarely use custom ports`);
    score += 25;
  }

  // 5. Excessive subdomains (e.g. paypal.secure.login.attacker.com)
  // Note: labels was already declared above for URL-shortener detection.
  if (labels.length > 4) {
    riskReasons.push(`Excessive subdomains (${labels.length - 2}) — a common phishing obfuscation technique`);
    score += 20;
  }

  // 6. Typosquatting detection
  for (const { brand, official } of KNOWN_BRANDS) {
    if (lowerHref.includes(brand)) {
      const isOfficial = official.some(
        (d) => lowerHostname === d || lowerHostname.endsWith(`.${d}`)
      );
      if (!isOfficial) {
        riskReasons.push(`Possible brand impersonation: the URL references "${brand}" but is not hosted on an official domain`);
        score += 50;
        break; // Only flag once
      }
    }
  }

  // 7. Phishing keywords in path or query
  const foundKeywords = PHISHING_KEYWORDS.filter((kw) => lowerPath.includes(kw));
  if (foundKeywords.length >= 2) {
    riskReasons.push(`Multiple phishing-related keywords found in path/query: ${foundKeywords.slice(0, 4).join(', ')}`);
    score += 25;
  } else if (foundKeywords.length === 1) {
    riskReasons.push(`Suspicious keyword in path/query: "${foundKeywords[0]}"`);
    score += 10;
  }

  // 8. Excessively long URL (often used to hide the true destination)
  if (href.length > 150) {
    riskReasons.push(`Unusually long URL (${href.length} characters) — may be designed to obscure the true destination`);
    score += 15;
  }

  // 9. Heavy URL-encoding (obfuscation)
  const encodedSegments = (href.match(/%[0-9a-fA-F]{2}/g) || []).length;
  if (encodedSegments > 8) {
    riskReasons.push(`Heavy URL encoding (${encodedSegments} encoded characters) — may indicate obfuscation`);
    score += 20;
  }

  // 10. Homoglyph / lookalike characters (e.g. 'g00gle', 'miсrosoft' with Cyrillic)
  const hasHomoglyph = /[^\x00-\x7F]/.test(hostname); // non-ASCII in hostname
  if (hasHomoglyph) {
    riskReasons.push('Non-ASCII (internationalized) characters in hostname — common in homoglyph phishing attacks');
    score += 45;
  }

  // 11. Multiple hyphens in hostname (often seen in scam pages)
  const hyphenCount = (hostname.match(/-/g) || []).length;
  if (hyphenCount >= 3) {
    riskReasons.push(`Multiple hyphens in hostname (${hyphenCount}) — a pattern frequently seen in phishing domains`);
    score += 15;
  }

  // Normalise to 0-100
  const confidenceScore = Math.min(score, 100);
  const isSafe = riskReasons.length === 0;

  return {
    isSafe,
    riskReasons,
    confidenceScore: isSafe ? 5 : confidenceScore,
  };
}

