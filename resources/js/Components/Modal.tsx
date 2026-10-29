import { Fragment, PropsWithChildren, ReactNode } from 'react';
import { Dialog, Transition } from '@headlessui/react';

interface Props {
    title: string;
    open: boolean;
    onClose: () => void;
    width?: string;
}

export default function Modal({
    title,
    open,
    onClose,
    width = 'max-w-3xl',
    children,
}: PropsWithChildren<Props>) {
    return (
        <Transition appear show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/60" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-200"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-150"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel
                                className={`w-full ${width} rounded-xl bg-white shadow-xl dark:bg-slate-800`}
                            >
                                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-slate-700">
                                    <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {title}
                                    </Dialog.Title>
                                    <button
                                        onClick={onClose}
                                        className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-700 dark:hover:text-gray-300"
                                    >
                                        <svg
                                            className="h-5 w-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                    </button>
                                </div>

                                <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
                                    {children}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

export function ModalSpinner() {
    return (
        <div className="flex items-center justify-center gap-3 py-10 text-gray-500 dark:text-gray-400">
            <svg
                className="h-5 w-5 animate-spin text-primary"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
            >
                <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                />
                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
            </svg>
            Cargando historial...
        </div>
    );
}

export function ModalError({ message }: { message: string }) {
    return (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {message}
        </div>
    );
}

export function EmptyState({
    children,
}: PropsWithChildren<{ children?: ReactNode }>) {
    return (
        <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
            {children ?? 'Sin mensajes.'}
        </div>
    );
}
