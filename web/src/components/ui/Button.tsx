import { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
};

export function Button({ variant = 'primary', className = '', children, ...rest }: Props) {
  return (
    <button className={`${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
