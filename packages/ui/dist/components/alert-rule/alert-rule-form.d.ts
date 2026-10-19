import { type DomainFrameProps } from '../../internal/domain.js';
import type { AlertRule } from './types.js';
export interface AlertRuleFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<AlertRule>;
    onSubmit: (value: Omit<AlertRule, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function AlertRuleForm({ onSubmit, ...props }: AlertRuleFormProps): import("react").JSX.Element;
