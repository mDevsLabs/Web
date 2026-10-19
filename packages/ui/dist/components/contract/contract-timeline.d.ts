import { type DomainFrameProps } from '../../internal/domain.js';
import type { ContractActivity } from './types.js';
export interface ContractTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly ContractActivity[];
    emptyMessage?: string;
}
export declare function ContractTimeline(props: ContractTimelineProps): import("react").JSX.Element;
