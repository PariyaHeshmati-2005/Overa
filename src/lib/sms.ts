/**
 * SMS provider adapter layer.
 *
 * The OTP logic (generation, hashing, rate limits, verification) is fully
 * separated from message delivery: swapping the SMS provider means editing
 * `getSmsProvider()` below only — the reservation / OTP flow never changes.
 *
 * Demo mode: while `SMS_PROVIDER_API_KEY` is unset, the DemoSmsProvider is
 * used. It sends NOTHING and pretends nothing was sent; the one-time code is
 * surfaced to the user exclusively through the API's labelled demo channel
 * (`demoMode: true` + `devCode`), which is gated server-side on the same
 * environment check. All validation rules (expiry, attempts, single use,
 * rate limits) stay real in demo mode.
 *
 * Future real provider (documented, NOT wired until credentials exist):
 *   SMS_PROVIDER_API_KEY   — provider account key (required to leave demo)
 *   SMS_SENDER_NUMBER      — provider line/sender number
 * To enable, implement a `SmsProvider` adapter (e.g. Kavenegar / SMS.ir) and
 * return it from `getSmsProvider()`. Until then, a configured-but-unknown
 * provider honestly reports failure instead of faking a successful send.
 */

export type SmsSendResult = {
  sent: boolean;
  /** true only for the labelled demo provider (no real SMS). */
  demo?: boolean;
  providerId?: string;
  error?: string;
};

export interface SmsProvider {
  readonly name: string;
  /** Deliver a one-time code. Implementations must NEVER log the code. */
  sendOtp(phone: string, code: string): Promise<SmsSendResult>;
}

/** Demo provider — active while SMS_PROVIDER_API_KEY is unset. */
export class DemoSmsProvider implements SmsProvider {
  readonly name = "demo";

  async sendOtp(_phone: string, _code: string): Promise<SmsSendResult> {
    // No network call, no logs — the code only reaches the client through the
    // API response's explicitly-labelled demo channel.
    return { sent: true, demo: true };
  }
}

/** A provider key is set but no real adapter is implemented yet. */
export class UnconfiguredSmsProvider implements SmsProvider {
  readonly name = "unconfigured";

  async sendOtp(): Promise<SmsSendResult> {
    return { sent: false, error: "sms_provider_unconfigured" };
  }
}

export function getSmsProvider(): SmsProvider {
  if (!process.env.SMS_PROVIDER_API_KEY) {
    return new DemoSmsProvider();
  }
  // TODO(real-sms): return the concrete adapter once credentials exist, e.g.
  //   return new KavenegarSmsProvider({
  //     apiKey: process.env.SMS_PROVIDER_API_KEY,
  //     sender: process.env.SMS_SENDER_NUMBER,
  //   });
  return new UnconfiguredSmsProvider();
}
