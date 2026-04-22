import React, { useEffect, useRef, useState } from "react";

export default function LanguageSelector({ options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find((item) => item.value === value)?.label || "Python";

  return (
    <div className="custom-dropdown" ref={rootRef}>
      <button
        type="button"
        className="dropdown-selected"
        onClick={() => setOpen((prev) => !prev)}
      >
        {selectedLabel} <span>v</span>
      </button>

      {open && (
        <div className="dropdown-menu">
          {options.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`dropdown-item ${item.value === value ? "active" : ""}`}
              onClick={() => {
                onChange(item.value);
                setOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
