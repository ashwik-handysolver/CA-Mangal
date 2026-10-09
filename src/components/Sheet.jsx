import { createPortal } from 'react-dom';
import { useSheetDrag, useLockBodyScroll } from '../lib/hooks';

export function Grabber() {
  return <div className="mx-auto mt-2.5 mb-1 h-1.5 w-10 rounded-full bg-slate-300 dark:bg-slate-600" />;
}

// Generic bottom sheet (rendered into <body> so transforms above it never break `fixed`).
export default function Sheet({ onClose, title, children, z = 150 }) {
  const { handlers, style } = useSheetDrag(onClose);
  useLockBodyScroll(onClose);

  return createPortal(
    <div className="fixed inset-0 flex items-end md:items-center md:justify-center" style={{ zIndex: z }}>
      <div className="absolute inset-0 bg-black/40 animate-fade" onClick={onClose} />
      <div
        className="relative w-full md:max-w-md max-h-[88dvh] flex flex-col rounded-t-[28px] md:rounded-2xl bg-[#f2f2f7] dark:bg-darkcard shadow-2xl animate-sheet pb-safe"
        style={style}
      >
        <div {...handlers} className="md:hidden touch-none">
          <Grabber />
        </div>
        {title && (
          <div {...handlers} className="px-5 pt-3 pb-2 text-center md:text-left md:touch-auto touch-none">
            <h2 className="text-[17px] font-semibold text-slate-900 dark:text-white">{title}</h2>
          </div>
        )}
        <div className="overflow-y-auto overscroll-contain px-4 pb-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}
