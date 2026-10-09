import { type DomainFrameProps } from '../../internal/domain.js';
import type { IssueSettingsValues } from './types.js';
export interface IssueSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: IssueSettingsValues;
    onChange: (key: keyof IssueSettingsValues, value: boolean) => void;
}
export declare function IssueSettings({ onChange, ...props }: IssueSettingsProps): import("react").JSX.Element;
