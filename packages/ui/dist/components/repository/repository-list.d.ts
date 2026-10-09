import { type DomainFrameProps } from '../../internal/domain.js';
import type { Repository } from './types.js';
export interface RepositoryListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Repository[];
    onSelect?: (item: Repository) => void;
    emptyMessage?: string;
}
export declare function RepositoryList({ onSelect, ...props }: RepositoryListProps): import("react").JSX.Element;
