import { type DomainFrameProps } from '../../internal/domain.js';
import type { Monitor } from './types.js';
export interface MonitorCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Monitor;
}
export declare function MonitorCard(props: MonitorCardProps): import("react").JSX.Element;
