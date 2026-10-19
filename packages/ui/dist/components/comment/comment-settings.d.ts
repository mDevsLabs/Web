import { type DomainFrameProps } from '../../internal/domain.js';
import type { CommentSettingsValues } from './types.js';
export interface CommentSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: CommentSettingsValues;
    onChange: (key: keyof CommentSettingsValues, value: boolean) => void;
}
export declare function CommentSettings({ onChange, ...props }: CommentSettingsProps): import("react").JSX.Element;
