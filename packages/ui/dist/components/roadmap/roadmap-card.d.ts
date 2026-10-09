import { type DomainFrameProps } from '../../internal/domain.js';
import type { Roadmap } from './types.js';
export interface RoadmapCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Roadmap;
}
export declare function RoadmapCard(props: RoadmapCardProps): import("react").JSX.Element;
