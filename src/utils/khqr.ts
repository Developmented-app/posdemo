import { BakongSettings } from "../types";

export function crc16(str: string): string {
  let crc = 0xFFFF;
  for (let c = 0; c < str.length; c++) {
    let code = str.charCodeAt(c);
    for (let i = 0; i < 8; i++) {
      let bit = ((code >> (7 - i) & 1) === 1);
      let c15 = ((crc >> 15 & 1) === 1);
      crc <<= 1;
      if (c15 !== bit) crc ^= 0x1021;
    }
  }
  crc &= 0xFFFF;
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function formatTag(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${tag}${len}${value}`;
}

export interface KHQRParams {
  settings: BakongSettings;
  amount: number; // strictly USD or KHR depending on currency
  currency: "USD" | "KHR";
  invoiceNo: string;
}

export function generateKHQRString({ settings, amount, currency, invoiceNo }: KHQRParams): {
  qrString: string;
  formattedAmount: string;
} {
  // 1. Payload Format Indicator
  let qrString = formatTag("00", "01");

  // 2. Point of Initiation Method: 12 (Dynamic) or 11 (Static)
  qrString += formatTag("01", "12");

  // 3. Merchant Account Info (Tag 29)
  // Subtags inside Tag 29
  let subTagValue = "";
  // Global Unique ID
  subTagValue += formatTag("00", "kh.com.bakong");
  // Merchant Mobile / ID (usually customized)
  subTagValue += formatTag("01", settings.merchantId);
  // Bank BIN or Bank Name
  subTagValue += formatTag("02", settings.acquirerId);
  // Optional Account Number
  subTagValue += formatTag("03", settings.merchantName);

  qrString += formatTag("29", subTagValue);

  // 4. Merchant Category Code
  qrString += formatTag("52", "5999");

  // 5. Transaction Currency
  // 840 = USD, 116 = KHR
  const currencyCode = currency === "USD" ? "840" : "116";
  qrString += formatTag("53", currencyCode);

  // 6. Transaction Amount
  const formattedAmount = amount.toFixed(currency === "USD" ? 2 : 0);
  qrString += formatTag("54", formattedAmount);

  // 7. Country Code
  qrString += formatTag("58", "KH");

  // 8. Merchant Name
  qrString += formatTag("59", settings.merchantName);

  // 9. Merchant City
  qrString += formatTag("60", settings.merchantCity);

  // 10. Additional Data Field (Tag 62)
  let additionalInfo = "";
  additionalInfo += formatTag("01", invoiceNo); // Bill Number / Invoice Number
  additionalInfo += formatTag("05", settings.storeLabel); // Reference Label (Store Counter)
  qrString += formatTag("62", additionalInfo);

  // 11. Add CRC-16 Checksum Header ("6304" indicating Tag 63, length 04)
  qrString += "6304";

  // Calculate Checksum of entire string so far
  const checksum = crc16(qrString);
  qrString += checksum;

  return {
    qrString,
    formattedAmount
  };
}
