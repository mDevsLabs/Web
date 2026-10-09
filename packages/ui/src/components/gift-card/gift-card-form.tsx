// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { GiftCard, GiftCardStatus, GiftCardActivity, GiftCardMetric, GiftCardSettingsValues } from './types.js';
export interface GiftCardFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<GiftCard>;
    onSubmit: (value: Omit<GiftCard, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function GiftCardForm({ onSubmit, ...props }: GiftCardFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<GiftCard, 'id'>)}/>; }
