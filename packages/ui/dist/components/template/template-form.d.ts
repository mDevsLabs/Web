import { type DomainFrameProps } from '../../internal/domain.js';
import type { Template } from './types.js';
export interface TemplateFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Template>;
    onSubmit: (value: Omit<Template, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function TemplateForm({ onSubmit, ...props }: TemplateFormProps): import("react").JSX.Element;
