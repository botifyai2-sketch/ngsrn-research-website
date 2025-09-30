import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none min-h-[44px]',
  {
    variants: {
      variant: {
        default: 'bg-ngsrn-blue text-white hover:bg-ngsrn-blue/90 focus-visible:ring-blue-500',
        secondary: 'bg-ngsrn-green text-white hover:bg-ngsrn-green/90 focus-visible:ring-green-500',
        accent: 'bg-ngsrn-gold text-ngsrn-blue hover:bg-ngsrn-gold/90 focus-visible:ring-yellow-500',
        outline: 'border border-ngsrn-blue text-ngsrn-blue hover:bg-ngsrn-blue/10 focus-visible:ring-blue-500',
        ghost: 'hover:bg-ngsrn-blue/10 text-ngsrn-blue focus-visible:ring-blue-500',
        link: 'underline-offset-4 hover:underline text-ngsrn-blue focus-visible:ring-blue-500 min-h-auto',
      },
      size: {
        default: 'h-10 py-2 px-4 min-w-[44px]',
        sm: 'h-9 px-3 rounded-md min-w-[44px]',
        lg: 'h-11 px-8 rounded-md min-w-[44px]',
        icon: 'h-10 w-10 min-h-[44px] min-w-[44px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };