import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

type ModalProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export default function Modal({ title, onClose, children }: ModalProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 lg:items-stretch lg:justify-end"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-paper text-ink shadow-2xl lg:h-dvh lg:max-h-none lg:w-[30rem] lg:rounded-none"
      >
        <header className="flex items-center justify-between gap-3 border-b-2 border-dashed border-line px-5 py-4 sm:px-6">
          <div>
            <h2
              id="modal-title"
              className="mt-1 font-display text-xl font-bold text-ink"
            >
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="grid size-9 place-items-center rounded-lg text-subtle hover:bg-mist hover:text-ink"
          >
            <X size={19} />
          </button>
        </header>

        {children}
      </section>
    </div>
  );
}
