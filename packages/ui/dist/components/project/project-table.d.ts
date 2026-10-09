import { type DomainFrameProps } from '../../internal/domain.js';
import type { Project } from './types.js';
export interface ProjectTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Project[];
    emptyMessage?: string;
}
export declare function ProjectTable(props: ProjectTableProps): import("react").JSX.Element;
