import { type DomainFrameProps } from '../../internal/domain.js';
import type { Issue } from './types.js';
export interface IssueFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Issue>;
    onSubmit: (value: Omit<Issue, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function IssueForm({ onSubmit, ...props }: IssueFormProps): import("react").JSX.Element;
