import { type DomainFrameProps } from '../../internal/domain.js';
import type { Incident } from './types.js';
export interface IncidentFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Incident>;
    onSubmit: (value: Omit<Incident, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function IncidentForm({ onSubmit, ...props }: IncidentFormProps): import("react").JSX.Element;
