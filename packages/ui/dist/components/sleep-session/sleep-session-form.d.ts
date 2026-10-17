import { type DomainFrameProps } from '../../internal/domain.js';
import type { SleepSession } from './types.js';
export interface SleepSessionFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<SleepSession>;
    onSubmit: (value: Omit<SleepSession, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function SleepSessionForm({ onSubmit, ...props }: SleepSessionFormProps): import("react").JSX.Element;
