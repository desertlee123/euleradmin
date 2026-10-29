import { router } from '@inertiajs/react';
import { Paginator } from '@/types';

interface Props<T> {
    paginator: Paginator<T>;
}

const baseClasses =
    'inline-flex min-w-[36px] items-center justify-center rounded-md border px-3 py-1.5 text-sm font-medium transition-colors';
const enabledClasses =
    'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700';
const disabledClasses =
    'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-600';
const activeClasses =
    'border-primary bg-primary text-white hover:bg-primary-dark';

export default function Pagination<T>({ paginator }: Props<T>) {
    if (paginator.last_page <= 1) {
        return null;
    }

    const goto = (url: string | null) => {
        if (!url) {
            return;
        }

        router.get(url, {}, { preserveState: true, preserveScroll: true });
    };

    const [previous, ...rest] = paginator.links;
    const next = rest.pop();
    const pageLinks = rest;

    return (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-gray-600 dark:text-gray-400">
                Mostrando {paginator.from ?? 0} a {paginator.to ?? 0} de{' '}
                {paginator.total} conversaciones
            </p>

            <nav
                aria-label="Paginación de conversaciones"
                className="flex flex-wrap items-center gap-1"
            >
                <button
                    type="button"
                    onClick={() => goto(previous?.url ?? null)}
                    disabled={!previous?.url}
                    className={`${baseClasses} ${
                        previous?.url ? enabledClasses : disabledClasses
                    }`}
                >
                    <svg
                        className="mr-1.5 h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                    Anterior
                </button>

                {pageLinks.map((link, index) =>
                    link.label === '...' ? (
                        <span
                            key={`gap-${index}`}
                            className="px-1 text-sm text-gray-400 dark:text-slate-600"
                        >
                            &hellip;
                        </span>
                    ) : (
                        <button
                            key={`page-${index}`}
                            type="button"
                            onClick={() => goto(link.url)}
                            disabled={!link.url}
                            className={`${baseClasses} ${
                                link.active ? activeClasses : enabledClasses
                            }`}
                        >
                            {link.label}
                        </button>
                    ),
                )}

                <button
                    type="button"
                    onClick={() => goto(next?.url ?? null)}
                    disabled={!next?.url}
                    className={`${baseClasses} ${
                        next?.url ? enabledClasses : disabledClasses
                    }`}
                >
                    Siguiente
                    <svg
                        className="ml-1.5 h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 5l7 7-7 7"
                        />
                    </svg>
                </button>
            </nav>
        </div>
    );
}
