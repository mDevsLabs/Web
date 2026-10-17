import { type DomainFrameProps } from '../../internal/domain.js';
import type { Project } from './types.js';
export interface ProjectFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Project>;
    onSubmit: (value: Omit<Project, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function ProjectForm({ onSubmit, ...props }: ProjectFormProps): import("react").JSX.Element;
