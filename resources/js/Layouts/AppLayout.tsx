import { Head } from '@inertiajs/react';
import { PropsWithChildren, ReactNode } from 'react';

interface Props {
    title?: string;
    header?: ReactNode;
}

export default function AppLayout({
    title,
    header,
    children,
}: PropsWithChildren<Props>) {
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-slate-900">
            <Head title={title} />

            <nav className="border-b border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800">
                <div className="mx-auto flex h-[60px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-bold text-white">
                            E
                        </div>
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                            Euler Admin
                        </span>
                        <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            Chats del bot
                        </span>
                    </div>
                </div>
            </nav>

            {header && (
                <header className="border-b border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800">
                    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    );
}
