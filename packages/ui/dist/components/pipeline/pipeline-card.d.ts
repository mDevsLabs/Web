import { type DomainFrameProps } from '../../internal/domain.js';
import type { Pipeline } from './types.js';
export interface PipelineCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Pipeline;
}
export declare function PipelineCard(props: PipelineCardProps): import("react").JSX.Element;
