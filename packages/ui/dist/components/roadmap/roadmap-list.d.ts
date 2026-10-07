import { type DomainFrameProps } from '../../internal/domain.js';
import type { Roadmap } from './types.js';
export interface RoadmapListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Roadmap[];
    onSelect?: (item: Roadmap) => void;
    emptyMessage?: string;
}
export declare function RoadmapList({ onSelect, ...props }: RoadmapListProps): import("react").JSX.Element;
