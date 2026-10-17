import { type DomainFrameProps } from '../../internal/domain.js';
import type { Sprint } from './types.js';
export interface SprintTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Sprint[];
    emptyMessage?: string;
}
export declare function SprintTable(props: SprintTableProps): import("react").JSX.Element;
