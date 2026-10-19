import { type DomainFrameProps } from '../../internal/domain.js';
import type { SleepSession } from './types.js';
export interface SleepSessionListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly SleepSession[];
    onSelect?: (item: SleepSession) => void;
    emptyMessage?: string;
}
export declare function SleepSessionList({ onSelect, ...props }: SleepSessionListProps): import("react").JSX.Element;
