import { type DomainFrameProps } from '../../internal/domain.js';
import type { Pipeline } from './types.js';
export interface PipelineListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Pipeline[];
    onSelect?: (item: Pipeline) => void;
    emptyMessage?: string;
}
export declare function PipelineList({ onSelect, ...props }: PipelineListProps): import("react").JSX.Element;
