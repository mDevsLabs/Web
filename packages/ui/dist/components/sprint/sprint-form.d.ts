import { type DomainFrameProps } from '../../internal/domain.js';
import type { Sprint } from './types.js';
export interface SprintFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Sprint>;
    onSubmit: (value: Omit<Sprint, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function SprintForm({ onSubmit, ...props }: SprintFormProps): import("react").JSX.Element;
