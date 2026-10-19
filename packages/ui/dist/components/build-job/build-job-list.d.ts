import { type DomainFrameProps } from '../../internal/domain.js';
import type { BuildJob } from './types.js';
export interface BuildJobListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly BuildJob[];
    onSelect?: (item: BuildJob) => void;
    emptyMessage?: string;
}
export declare function BuildJobList({ onSelect, ...props }: BuildJobListProps): import("react").JSX.Element;
