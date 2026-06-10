import type {ReactNode} from "react";

interface FlexRowProps {
    children: ReactNode;
    weight?: 'flex-1' | 'flex-2' | 'flex-none';
    gridCols?: '1' | '2' | '3' | '5'
    className?: string;
}

export function DashboardFlexRow({ children, weight = 'flex-1', gridCols = '1', className = ''}: FlexRowProps) {
    const gridClass = {
        '1' : 'grid-cols-1',
        '2' : 'grid-cols-1 lg:grid-cols-2',
        '3' : 'grid-cols-1 md:grid-cols-3',
        '5' : 'grid-cols-1 lg:grid-cols-5',
    }[gridCols];

    return (
        <section className={`${weight} grid ${gridClass} gap-4 lg:min-h-0 ${className}`}>
            {children}
        </section>
    )
}