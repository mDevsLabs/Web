import { type DomainFrameProps } from '../../internal/domain.js';
import type { Project } from './types.js';
export interface ProjectCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Project;
}
export declare function ProjectCard(props: ProjectCardProps): import("react").JSX.Element;
