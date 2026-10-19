import { type DomainFrameProps } from '../../internal/domain.js';
import type { SleepSession } from './types.js';
export interface SleepSessionCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: SleepSession;
}
export declare function SleepSessionCard(props: SleepSessionCardProps): import("react").JSX.Element;
