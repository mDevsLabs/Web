import { type DomainFrameProps } from '../../internal/domain.js';
import type { Pipeline } from './types.js';
export interface PipelineTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Pipeline[];
    emptyMessage?: string;
}
export declare function PipelineTable(props: PipelineTableProps): import("react").JSX.Element;
