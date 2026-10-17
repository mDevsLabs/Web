import { type DomainFrameProps } from '../../internal/domain.js';
import type { Incident } from './types.js';
export interface IncidentCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Incident;
}
export declare function IncidentCard(props: IncidentCardProps): import("react").JSX.Element;
