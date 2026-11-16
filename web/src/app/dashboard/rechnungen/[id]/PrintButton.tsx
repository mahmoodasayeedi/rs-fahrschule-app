"use client";

export default function PrintButton() {
    return (
        <button
            onClick={() => window.print()}
            className="rounded bg-[#ff8800] px-4 py-2 text-sm font-medium text-black"
        >
            Drucken / als PDF speichern
        </button>
    );
}
