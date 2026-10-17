import { type DomainFrameProps } from '../../internal/domain.js';
import type { Destination } from './types.js';
export interface DestinationFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Destination>;
    onSubmit: (value: Omit<Destination, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function DestinationForm({ onSubmit, ...props }: DestinationFormProps): import("react").JSX.Element;
