import { type DomainFrameProps } from '../../internal/domain.js';
import type { Contract } from './types.js';
export interface ContractFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Contract>;
    onSubmit: (value: Omit<Contract, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function ContractForm({ onSubmit, ...props }: ContractFormProps): import("react").JSX.Element;
