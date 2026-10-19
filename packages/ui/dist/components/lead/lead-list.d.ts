import { type DomainFrameProps } from '../../internal/domain.js';
import type { Lead } from './types.js';
export interface LeadListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Lead[];
    onSelect?: (item: Lead) => void;
    emptyMessage?: string;
}
export declare function LeadList({ onSelect, ...props }: LeadListProps): import("react").JSX.Element;
