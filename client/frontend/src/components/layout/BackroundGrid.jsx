function BackroundGrid() {
    return (
        <div
          className="fixed inset-0 pointer-events-none opacity-[0.022] dark:opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)`,
            backgroundSize: "56px 56px",
          }}
        />
    );
}

export default BackroundGrid;