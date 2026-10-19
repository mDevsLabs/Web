import { type DomainFrameProps } from '../../internal/domain.js';
import type { Roadmap } from './types.js';
export interface RoadmapTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Roadmap[];
    emptyMessage?: string;
}
export declare function RoadmapTable(props: RoadmapTableProps): import("react").JSX.Element;
