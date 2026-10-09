import { type DomainFrameProps } from '../../internal/domain.js';
import type { Audience } from './types.js';
export interface AudienceCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Audience;
}
export declare function AudienceCard(props: AudienceCardProps): import("react").JSX.Element;
