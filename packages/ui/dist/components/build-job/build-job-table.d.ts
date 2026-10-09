import { type DomainFrameProps } from '../../internal/domain.js';
import type { BuildJob } from './types.js';
export interface BuildJobTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly BuildJob[];
    emptyMessage?: string;
}
export declare function BuildJobTable(props: BuildJobTableProps): import("react").JSX.Element;
