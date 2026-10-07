import { type DomainFrameProps } from '../../internal/domain.js';
import type { GiftCard } from './types.js';
export interface GiftCardFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<GiftCard>;
    onSubmit: (value: Omit<GiftCard, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function GiftCardForm({ onSubmit, ...props }: GiftCardFormProps): import("react").JSX.Element;
