import { type FormHTMLAttributes } from 'react';
export interface FormProps extends Omit<FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
    onValuesSubmit?: (data: FormData) => void;
    onSubmit?: FormHTMLAttributes<HTMLFormElement>['onSubmit'];
}
export declare function Form({ onValuesSubmit, onSubmit, className, ...props }: FormProps): import("react").JSX.Element;
