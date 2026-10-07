import { type DomainFrameProps } from '../../internal/domain.js';
import type { Pipeline } from './types.js';
export interface PipelineFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Pipeline>;
    onSubmit: (value: Omit<Pipeline, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function PipelineForm({ onSubmit, ...props }: PipelineFormProps): import("react").JSX.Element;
