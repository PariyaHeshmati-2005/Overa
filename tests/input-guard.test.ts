import { describe, expect, test } from "bun:test";
import {
  attachNumericInputGuard,
  digitsOnly,
  digitsToNumber,
  foldDigits,
} from "../src/lib/input-guard";

describe("input-guard (positive digits only)", () => {
  test("foldDigits folds Persian and Arabic digits", () => {
    expect(foldDigits("۱۲۳")).toBe("123");
    expect(foldDigits("٤٥٦")).toBe("456");
    expect(foldDigits("مخلوط ۷۸ و 9")).toBe("مخلوط 78 و 9");
  });

  test("digitsOnly keeps digits and drops everything else", () => {
    expect(digitsOnly("123")).toBe("123");
    expect(digitsOnly("-500")).toBe("500");
    expect(digitsOnly("+420")).toBe("420");
    expect(digitsOnly("۱٫۵")).toBe("15");
    expect(digitsOnly("abc")).toBe("");
    expect(digitsOnly("1e5")).toBe("15");
    expect(digitsOnly("12,000")).toBe("12000");
    expect(digitsOnly("۵۰۰۰")).toBe("5000");
    expect(digitsOnly(" ۸۸ ")).toBe("88");
  });

  test("digitsOnly collapses leading zeros", () => {
    expect(digitsOnly("000123")).toBe("123");
    expect(digitsOnly("000")).toBe("0");
    expect(digitsOnly("007")).toBe("7");
  });

  test("digitsToNumber returns a positive integer or 0", () => {
    expect(digitsToNumber("450000")).toBe(450000);
    expect(digitsToNumber("-9")).toBe(9);
    expect(digitsToNumber("")).toBe(0);
    expect(digitsToNumber("ناموجود")).toBe(0);
    expect(digitsToNumber("۱۰۰")).toBe(100);
  });
});

describe("attachNumericInputGuard (DOM guard)", () => {
  // Minimal DOM stand-ins matching the document.addEventListener contract.
  function makeDoc() {
    const listeners: Record<string, EventListener> = {};
    const doc = {
      addEventListener: (type: string, fn: EventListener) => {
        listeners[type] = fn;
      },
      removeEventListener: () => {},
    } as unknown as Document;
    return { doc, listeners };
  }

  function makeInput(attrs: Record<string, string>) {
    const el = {
      value: "",
      dataset: {},
      getAttribute: (n: string) => attrs[n] ?? null,
      setSelectionRange: () => {},
      dispatchEvent: () => true,
    } as unknown as HTMLInputElement;
    return el;
  }

  /** Fake keyboard event whose preventDefault is observable. */
  function keyEvent(key: string, target: unknown) {
    let prevented = false;
    const ev = {
      key,
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      preventDefault: () => {
        prevented = true;
      },
      get defaultPrevented() {
        return prevented;
      },
      target,
    } as unknown as KeyboardEvent;
    return ev;
  }

  test("keydown blocks letters, signs and separators on numeric inputs", () => {
    const { doc, listeners } = makeDoc();
    attachNumericInputGuard(doc);
    const input = makeInput({ inputmode: "numeric" });
    const blocked = ["-", "+", "e", "E", ".", "a", "ب"];
    for (const key of blocked) {
      const e = keyEvent(key, input);
      listeners["keydown"](e);
      expect(e.defaultPrevented).toBe(true);
    }
    // Digits, Persian digits and navigation keys pass through
    for (const key of ["5", "۷", "Backspace", "ArrowLeft", "Tab"]) {
      const e = keyEvent(key, input);
      listeners["keydown"](e);
      expect(e.defaultPrevented).toBe(false);
    }
  });

  test("keydown does not touch plain text inputs", () => {
    const { doc, listeners } = makeDoc();
    attachNumericInputGuard(doc);
    const text = makeInput({ type: "text" });
    let prevented = false;
    const ev = { key: "-", ctrlKey: false, metaKey: false, altKey: false, preventDefault: () => { prevented = true; }, target: text } as unknown as KeyboardEvent;
    listeners["keydown"](ev);
    expect(prevented).toBe(false);
  });

  test("input sanitizes values on numeric fields", () => {
    const { doc, listeners } = makeDoc();
    attachNumericInputGuard(doc);
    const input = makeInput({ inputmode: "numeric" });
    input.value = "-۵۰۰abc";
    listeners["input"]({ target: input } as unknown as Event);
    expect(input.value).toBe("500");
  });
});
