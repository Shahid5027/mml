/**
 * Generates a lightweight, non-invasive, deterministic browser/device signature.
 * Combines user agent, platform, language, timezone, and screen resolution.
 */
export const getDeviceFingerprint = (): string => {
  const parts = [
    navigator.userAgent || '',
    navigator.platform || '',
    navigator.language || '',
    Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    `${window.screen.width}x${window.screen.height}`
  ];
  
  const rawString = parts.join('|');
  
  // Fast, lightweight djb2-like string hashing
  let hash = 5381;
  for (let i = 0; i < rawString.length; i++) {
    hash = (hash * 33) ^ rawString.charCodeAt(i);
  }
  
  // Return absolute unsigned 32-bit integer in hexadecimal format
  return (hash >>> 0).toString(16);
};

/**
 * Parses user agent to return a clean, professional, human-readable browser & OS name.
 */
export const getDeviceName = (): string => {
  const ua = navigator.userAgent;
  let browser = "Unknown Browser";
  let os = "Unknown OS";
  
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Edge")) browser = "Edge";
  
  if (ua.includes("Windows")) os = "Windows PC";
  else if (ua.includes("Macintosh") || ua.includes("Mac OS")) os = "MacBook / macOS";
  else if (ua.includes("Linux")) os = "Linux Machine";
  else if (ua.includes("Android")) os = "Android Device";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS Device";
  
  return `${browser} on ${os}`;
};
