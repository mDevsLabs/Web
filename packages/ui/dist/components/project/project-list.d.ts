import { type DomainFrameProps } from '../../internal/domain.js';
import type { Project } from './types.js';
export interface ProjectListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Project[];
    onSelect?: (item: Project) => void;
    emptyMessage?: string;
}
export declare function ProjectList({ onSelect, ...props }: ProjectListProps): import("react").JSX.Element;
