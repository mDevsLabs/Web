import { type DomainFrameProps } from '../../internal/domain.js';
import type { Contact } from './types.js';
export interface ContactTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Contact[];
    emptyMessage?: string;
}
export declare function ContactTable(props: ContactTableProps): import("react").JSX.Element;
