import { type DomainFrameProps } from '../../internal/domain.js';
import type { Environment } from './types.js';
export interface EnvironmentFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Environment>;
    onSubmit: (value: Omit<Environment, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function EnvironmentForm({ onSubmit, ...props }: EnvironmentFormProps): import("react").JSX.Element;
