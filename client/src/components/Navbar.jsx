// components/NavBar.jsx
import React from "react";

export default function NavBar() {
  const handleClick = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header className="nav">
      <div className="nav-inner">
        <div className="brand">Marg AI</div>

        <nav className="nav-links">
          <button className="nav-link" onClick={() => handleClick("home")}>Home</button>
          <button className="nav-link" onClick={() => handleClick("about")}>About</button>
          <button className="nav-link" onClick={() => handleClick("services")}>Services</button>
          <button className="nav-link" onClick={() => handleClick("testimonials")}>Testimonials</button>
          <button className="nav-link" onClick={() => handleClick("contact")}>Contact</button>
          <button className="nav-cta" onClick={() => handleClick("login")}>LOGIN</button>
        </nav>
      </div>
    </header>
  );
}