import { type DomainFrameProps } from '../../internal/domain.js';
import type { Release } from './types.js';
export interface ReleaseListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Release[];
    onSelect?: (item: Release) => void;
    emptyMessage?: string;
}
export declare function ReleaseList({ onSelect, ...props }: ReleaseListProps): import("react").JSX.Element;
