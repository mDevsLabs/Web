import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type GiftCard = {
    id?: string;
    code: string;
    recipient: string;
    balance: number;
    expiresOn: string;
    status: "active" | "redeemed" | "expired";
};
export type GiftCardStatus = GiftCard['status'];
export interface GiftCardActivity extends DomainActivity {
    giftcardId?: string;
}
export type GiftCardMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalGiftCard' | 'activeGiftCard' | 'valueGiftCard';
};
export type GiftCardSettingsValues = Partial<Record<"notifyGiftCard" | "archiveGiftCard" | "approveGiftCard", boolean>>;
