// Expects a string starting with '0x'
export const hexToU8a = (hex: string): Uint8Array => {
  const bytes = [];
  for (let c = 2; c < hex.length; c += 2) bytes.push(parseInt(hex.substring(c, c + 2), 16));
  return new Uint8Array(bytes);
};
