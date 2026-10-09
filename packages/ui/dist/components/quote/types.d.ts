import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Quote = {
    id?: string;
    number: string;
    customer: string;
    amount: number;
    validUntil: string;
    status: "draft" | "sent" | "accepted" | "declined";
};
export type QuoteStatus = Quote['status'];
export interface QuoteActivity extends DomainActivity {
    quoteId?: string;
}
export type QuoteMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalQuote' | 'activeQuote' | 'valueQuote';
};
export type QuoteSettingsValues = Partial<Record<"notifyQuote" | "archiveQuote" | "approveQuote", boolean>>;
