import { type DomainFrameProps } from '../../internal/domain.js';
import type { Integration } from './types.js';
export interface IntegrationFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Integration>;
    onSubmit: (value: Omit<Integration, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function IntegrationForm({ onSubmit, ...props }: IntegrationFormProps): import("react").JSX.Element;
