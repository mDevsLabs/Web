import { type DomainFrameProps } from '../../internal/domain.js';
import type { Workspace } from './types.js';
export interface WorkspaceFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Workspace>;
    onSubmit: (value: Omit<Workspace, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function WorkspaceForm({ onSubmit, ...props }: WorkspaceFormProps): import("react").JSX.Element;
