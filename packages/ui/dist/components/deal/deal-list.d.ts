import { type DomainFrameProps } from '../../internal/domain.js';
import type { Deal } from './types.js';
export interface DealListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Deal[];
    onSelect?: (item: Deal) => void;
    emptyMessage?: string;
}
export declare function DealList({ onSelect, ...props }: DealListProps): import("react").JSX.Element;
