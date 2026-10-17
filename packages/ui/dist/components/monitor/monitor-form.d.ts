import { type DomainFrameProps } from '../../internal/domain.js';
import type { Monitor } from './types.js';
export interface MonitorFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Monitor>;
    onSubmit: (value: Omit<Monitor, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function MonitorForm({ onSubmit, ...props }: MonitorFormProps): import("react").JSX.Element;
