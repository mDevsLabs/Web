import { type DomainFrameProps } from '../../internal/domain.js';
import type { Folder } from './types.js';
export interface FolderFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Folder>;
    onSubmit: (value: Omit<Folder, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function FolderForm({ onSubmit, ...props }: FolderFormProps): import("react").JSX.Element;
