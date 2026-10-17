import { type DomainFrameProps } from '../../internal/domain.js';
import type { Release } from './types.js';
export interface ReleaseTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Release[];
    emptyMessage?: string;
}
export declare function ReleaseTable(props: ReleaseTableProps): import("react").JSX.Element;
