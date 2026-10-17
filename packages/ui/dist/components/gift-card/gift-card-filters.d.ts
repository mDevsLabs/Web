import { type DomainFrameProps } from '../../internal/domain.js';
import type { GiftCardStatus } from './types.js';
export interface GiftCardFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: GiftCardStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: GiftCardStatus | '') => void;
}
export declare function GiftCardFilters({ onStatusChange, ...props }: GiftCardFiltersProps): import("react").JSX.Element;
