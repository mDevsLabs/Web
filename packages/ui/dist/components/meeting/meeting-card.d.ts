import { type DomainFrameProps } from '../../internal/domain.js';
import type { Meeting } from './types.js';
export interface MeetingCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Meeting;
}
export declare function MeetingCard(props: MeetingCardProps): import("react").JSX.Element;
