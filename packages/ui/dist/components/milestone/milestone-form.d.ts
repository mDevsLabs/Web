import { type DomainFrameProps } from '../../internal/domain.js';
import type { Milestone } from './types.js';
export interface MilestoneFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Milestone>;
    onSubmit: (value: Omit<Milestone, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function MilestoneForm({ onSubmit, ...props }: MilestoneFormProps): import("react").JSX.Element;
