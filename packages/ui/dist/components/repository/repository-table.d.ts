import { type DomainFrameProps } from '../../internal/domain.js';
import type { Repository } from './types.js';
export interface RepositoryTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Repository[];
    emptyMessage?: string;
}
export declare function RepositoryTable(props: RepositoryTableProps): import("react").JSX.Element;
