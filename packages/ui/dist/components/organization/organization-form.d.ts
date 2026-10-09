import { type DomainFrameProps } from '../../internal/domain.js';
import type { Organization } from './types.js';
export interface OrganizationFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Organization>;
    onSubmit: (value: Omit<Organization, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function OrganizationForm({ onSubmit, ...props }: OrganizationFormProps): import("react").JSX.Element;
