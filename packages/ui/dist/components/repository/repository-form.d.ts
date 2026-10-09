import { type DomainFrameProps } from '../../internal/domain.js';
import type { Repository } from './types.js';
export interface RepositoryFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Repository>;
    onSubmit: (value: Omit<Repository, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function RepositoryForm({ onSubmit, ...props }: RepositoryFormProps): import("react").JSX.Element;
