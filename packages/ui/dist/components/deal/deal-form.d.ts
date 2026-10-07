import { type DomainFrameProps } from '../../internal/domain.js';
import type { Deal } from './types.js';
export interface DealFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Deal>;
    onSubmit: (value: Omit<Deal, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function DealForm({ onSubmit, ...props }: DealFormProps): import("react").JSX.Element;
