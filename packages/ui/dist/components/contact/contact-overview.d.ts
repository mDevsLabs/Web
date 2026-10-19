import { type DomainFrameProps } from '../../internal/domain.js';
import type { Contact, ContactMetric } from './types.js';
export interface ContactOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Contact[];
    metrics: readonly ContactMetric[];
}
export declare function ContactOverview(props: ContactOverviewProps): import("react").JSX.Element;
