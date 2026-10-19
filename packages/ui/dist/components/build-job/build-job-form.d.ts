import { type DomainFrameProps } from '../../internal/domain.js';
import type { BuildJob } from './types.js';
export interface BuildJobFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<BuildJob>;
    onSubmit: (value: Omit<BuildJob, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function BuildJobForm({ onSubmit, ...props }: BuildJobFormProps): import("react").JSX.Element;
