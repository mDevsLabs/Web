import { type DomainFrameProps } from '../../internal/domain.js';
import type { Lead } from './types.js';
export interface LeadCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Lead;
}
export declare function LeadCard(props: LeadCardProps): import("react").JSX.Element;
