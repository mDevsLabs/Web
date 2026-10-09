import { type DomainFrameProps } from '../../internal/domain.js';
import type { Contact } from './types.js';
export interface ContactListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Contact[];
    onSelect?: (item: Contact) => void;
    emptyMessage?: string;
}
export declare function ContactList({ onSelect, ...props }: ContactListProps): import("react").JSX.Element;
