import { type DomainFrameProps } from '../../internal/domain.js';
import type { Database } from './types.js';
export interface DatabaseFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Database>;
    onSubmit: (value: Omit<Database, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function DatabaseForm({ onSubmit, ...props }: DatabaseFormProps): import("react").JSX.Element;
