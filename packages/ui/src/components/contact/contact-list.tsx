// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Contact, ContactStatus, ContactActivity, ContactMetric, ContactSettingsValues } from './types.js';
export interface ContactListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Contact[];
    onSelect?: (item: Contact) => void;
    emptyMessage?: string;
}
export function ContactList({ onSelect, ...props }: ContactListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Contact) : undefined}/>; }
