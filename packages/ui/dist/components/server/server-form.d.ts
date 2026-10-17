import { type DomainFrameProps } from '../../internal/domain.js';
import type { Server } from './types.js';
export interface ServerFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Server>;
    onSubmit: (value: Omit<Server, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function ServerForm({ onSubmit, ...props }: ServerFormProps): import("react").JSX.Element;
