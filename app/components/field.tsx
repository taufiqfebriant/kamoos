import type { ReactElement } from 'react';
import { useContext } from 'react';
import { createContext } from 'react';
import type { HTMLProps } from 'react';
import type { FieldProps } from 'remix-validated-form';
import { useField } from 'remix-validated-form';

type FieldContextProps = { name: string } & FieldProps;

const FieldContext = createContext<FieldContextProps | null>(null);

interface CustomFieldProps {
	name: string;
	children: ReactElement | ReactElement[];
}

export const Field = ({ name, children }: CustomFieldProps) => {
	const fieldProps = useField(name);

	return (
		<FieldContext.Provider value={{ name, ...fieldProps }}>
			{children}
		</FieldContext.Provider>
	);
};

type LabelProps = {
	children: ReactElement | ReactElement[] | string;
} & HTMLProps<HTMLLabelElement>;

Field.Label = function Label({ children, ...restProps }: LabelProps) {
	return <label {...restProps}>{children}</label>;
};

type DescriptionProps = {
	children: ReactElement | ReactElement[] | string;
} & HTMLProps<HTMLParagraphElement>;

Field.Description = function Description({
	children,
	...restProps
}: DescriptionProps) {
	return <p {...restProps}>{children}</p>;
};

Field.Textarea = function Textarea(
	props: Omit<HTMLProps<HTMLTextAreaElement>, 'name'>
) {
	const fieldContext = useContext(FieldContext);

	return (
		<textarea
			name={fieldContext?.name}
			{...fieldContext?.getInputProps<
				Omit<HTMLProps<HTMLTextAreaElement>, 'name'>
			>({
				...props
			})}
		/>
	);
};

Field.Input = function Input(props: Omit<HTMLProps<HTMLInputElement>, 'name'>) {
	const fieldContext = useContext(FieldContext);

	return (
		<input
			name={fieldContext?.name}
			{...fieldContext?.getInputProps({
				...props
			})}
		/>
	);
};

Field.Error = function Error(props: HTMLProps<HTMLSpanElement>) {
	const fieldContext = useContext(FieldContext);
	const error = fieldContext?.error;

	if (!error) {
		return null;
	}

	return <span {...props}>{error}</span>;
};

// import { createContext, HTMLProps, ReactElement } from "react";
// import { useField } from "remix-validated-form";
// import type { GetInputProps } from "remix-validated-form/dist/types/internal/getInputProps";

// const Input = ({ name, ...restProps }: GetInputProps) => {
// 	const { getInputProps } = useField(name);
// 	const contextValue = {name}

// 	return <input {...getInputProps({ ...restProps })} />;
// };

// interface LabelProps {
// 	children?: ReactElement;
// }

// Input.Label = function InputLabel({
// 	children,
// 	...restProps
// }: LabelProps & HTMLProps<HTMLLabelElement>) {
// 	return <label {...restProps}>{children}</label>;
// };

// Input.Error = function InputError({

// })
