import { type DomainFrameProps } from '../../internal/domain.js';
import type { Database } from './types.js';
export interface DatabaseListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Database[];
    onSelect?: (item: Database) => void;
    emptyMessage?: string;
}
export declare function DatabaseList({ onSelect, ...props }: DatabaseListProps): import("react").JSX.Element;
