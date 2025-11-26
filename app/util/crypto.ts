export const toBase64 = (buffer: Uint8Array<ArrayBuffer>) =>
  btoa(String.fromCharCode(...buffer));
