declare module '@cashfreepayments/cashfree-js' {
    export function load(options: { mode: "sandbox" | "production" }): Cashfree;

    export interface Cashfree {
        checkout(options: CheckoutOptions): Promise<CheckoutResult>;
    }

    export interface CheckoutOptions {
        paymentSessionId: string;
        redirectTarget?: "_self" | "_modal" | "_blank";
        returnUrl?: string; // If redirectTarget is _self or _blank
    }

    export interface CheckoutResult {
        error?: any;
        redirect?: boolean;
        paymentDetails?: any;
    }
}
