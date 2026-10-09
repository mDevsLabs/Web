import { type DomainFrameProps } from '../../internal/domain.js';
import type { Lead } from './types.js';
export interface LeadTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Lead[];
    emptyMessage?: string;
}
export declare function LeadTable(props: LeadTableProps): import("react").JSX.Element;
