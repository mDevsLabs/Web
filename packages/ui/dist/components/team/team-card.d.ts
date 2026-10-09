import { type DomainFrameProps } from '../../internal/domain.js';
import type { Team } from './types.js';
export interface TeamCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Team;
}
export declare function TeamCard(props: TeamCardProps): import("react").JSX.Element;
