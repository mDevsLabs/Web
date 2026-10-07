import { type DomainFrameProps } from '../../internal/domain.js';
import type { Destination } from './types.js';
export interface DestinationListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Destination[];
    onSelect?: (item: Destination) => void;
    emptyMessage?: string;
}
export declare function DestinationList({ onSelect, ...props }: DestinationListProps): import("react").JSX.Element;
