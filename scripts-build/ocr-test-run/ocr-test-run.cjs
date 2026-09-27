// OCR parsing tests for the card scanner. Uses the real parsing functions
// compiled from src/lib/cardOcr.ts — no network, no camera, no DOM — so the
// extractors, the checksum and the brand reads can be checked directly.
// SIMULATED TEST PAN ONLY (4539 1488 0343 6467): never a real card number.

const ocr = require("./cardOcr.cjs");

let failures = 0;
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    failures += 1;
    console.log(`FAIL ${name}: got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`);
  } else {
    console.log(`ok ${name}`);
  }
}

// Pure parsing: simulated OCR text of a Visa card.
const visa = "BANK OF AMERICA\n4539 1488 0343 6467\nJOHN Q PUBLIC\nVALID THRU 09/28\n";
const pan = ocr.extractNumber(visa);
check("visa pan", pan.number, "4539148803436467");
check("visa last4", pan.number.slice(-4), "6467");
check("visa expiry", ocr.extractExpiry(visa), "09/28");
check("visa holder", ocr.extractHolder(visa), "JOHN Q PUBLIC");
check("visa brand", ocr.brandFromNumber(pan.number), "Visa");
check("mask", ocr.maskPan(pan.number), "**** **** **** 6467");
check("format", ocr.formatPan(pan.number), "4539 1488 0343 6467");

// OCR confusion: letter shapes inside the digit run.
check("confused pan", ocr.extractNumber("4539 I488 0343 6467").number, "4539148803436467");
check("confused expiry", ocr.extractExpiry("VALID THRU O9/28"), "09/28");

// Pan-number extraction stays Luhn-locked: long streams only match when they
// stand alone in the digit field, so one bad scan never invents digits.
const bad = ocr.extractNumber("4111 1111 1111 1112");
check("bad number empty", bad.number, "");
check("bad unverified", bad.unverified, "4111111111111112");
check("bad split window", ocr.extractNumber("4111 1111\n1111 1112").number, "");
check("good split window", ocr.extractNumber("4539 1488\n0343 6467").number, "4539148803436467");
check("luhn true", ocr.luhnOk("4539148803436467"), true);
check("luhn false", ocr.luhnOk("4539148803436468"), false);

// Amex (15 digits) and Mastercard brand reads.
check("amex", ocr.extractNumber("3782 822463 10005").number, "378282246310005");
check("mc brand", ocr.brandFromNumber("5532123456789012"), "Mastercard");
check("amex brand", ocr.brandFromNumber("378282246310005"), "American Express");
check("junk year", ocr.extractExpiry("VALID 12/99"), "");
check("junk text", ocr.extractNumber("HELLO WORLD"), { number: "", unverified: "" });
check("digitsOnly", ocr.digitsOnly("ab12cd"), "12");

if (failures > 0) {
  console.log(`${failures} OCR test(s) FAILED`);
  process.exit(1);
}
console.log("All OCR tests passed");
