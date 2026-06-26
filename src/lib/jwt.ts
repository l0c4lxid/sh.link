import crypto from "crypto";

const JWT_SECRET = process.env.API_KEY || "al-sOtfLYZohz_ClsGebVD38Ni85mUzR_jHHov8FRwlufJ";

export function signJwt(payload: object): string {
  const header = { alg: "HS256", typ: "JWT" };
  const base64Header = Buffer.from(JSON.stringify(header)).toString("base64url");
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  
  const hmac = crypto.createHmac("sha256", JWT_SECRET);
  hmac.update(`${base64Header}.${base64Payload}`);
  const base64Signature = hmac.digest("base64url");
  
  return `${base64Header}.${base64Payload}.${base64Signature}`;
}

export function verifyJwt(token: string): any {
  try {
    const [base64Header, base64Payload, base64Signature] = token.split(".");
    if (!base64Header || !base64Payload || !base64Signature) return null;
    
    const hmac = crypto.createHmac("sha256", JWT_SECRET);
    hmac.update(`${base64Header}.${base64Payload}`);
    const expectedSignature = hmac.digest("base64url");
    
    if (base64Signature !== expectedSignature) return null;
    
    const payloadJson = Buffer.from(base64Payload, "base64url").toString("utf8");
    return JSON.parse(payloadJson);
  } catch {
    return null;
  }
}
