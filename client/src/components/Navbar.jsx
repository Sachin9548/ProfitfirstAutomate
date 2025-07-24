import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Function to control navbar visibility based on scroll direction
  const controlNavbar = () => {
    if (typeof window !== "undefined") {
      if (window.scrollY > lastScrollY) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }
      setLastScrollY(window.scrollY);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.addEventListener("scroll", controlNavbar);
      return () => {
        window.removeEventListener("scroll", controlNavbar);
      };
    }
  }, [lastScrollY]);

  // Toggle the drawer state
  const toggleDrawer = () => {
    setDrawerOpen((prev) => !prev);
  };

  return (
    <>
      <nav
        className={`${
          // Force navbar to remain visible when drawer is open
          drawerOpen || showNavbar ? "translate-y-0" : "-translate-y-full"
        } fixed top-0 left-0 w-full flex items-center justify-between px-4 py-4 transition-transform duration-300 z-50 backdrop-blur-3xl`}
        style={{ padding: "2px 10%" }}
      >
        {/* Logo aligned to left in mobile view; hide on mobile when drawer is open */}
        <div className="flex-shrink-0">
          <Link to="/">
            <img
              src="https://res.cloudinary.com/dqdvr35aj/image/upload/v1748330108/Logo1_zbbbz4.png"
              alt="Logo"
              width={150}
              className={`${drawerOpen ? "hidden md:block" : "block"}`}
            />
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <ul className="hidden md:flex space-x-6 text-[#fff] gap-6">
          <li>
            <Link to="/" className="hover:text-green-500">
              Home
            </Link>
          </li>
          <li>
            <a href="#DASHBOARD" className="hover:text-green-500">
              Resources
            </a>
          </li>
          <li>
            <a href="#USECASES" className="hover:text-green-500">
              Use Cases
            </a>
          </li>
          <li>
            <a href="#BLOG" className="hover:text-green-500">
              Blog
            </a>
          </li>
          <li>
            <a href="#PRICING" className="hover:text-green-500">
              Pricing
            </a>
          </li>
        </ul>

        {/* Desktop Get Started Button */}
        <div className="hidden md:block">
          <Link
            to="/signup"
            className="bg-green-500 text-white px-4 py-2 hover:bg-gray-900 transition rounded-lg"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Hamburger Icon */}
        <div className="md:hidden">
          <button onClick={toggleDrawer} aria-label="Toggle Menu">
            {drawerOpen ? (
              <svg
                className="w-6 h-6 text-white absolute bottom-0 right-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6 text-white"
                
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-[#101218] text-white shadow-lg transform transition-transform duration-300 z-40 ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-4">
          {/* Optional: Drawer header */}
          <div className="mb-4">
            <Link to="/" onClick={() => setDrawerOpen(false)}>
              {/* Optional small logo or title */}
            </Link>
          </div>
          <ul className="flex flex-col space-y-4 text-white">
            <li>
              <Link
                to="/"
                onClick={() => setDrawerOpen(false)}
                className="hover:text-green-500"
              >
                Home
              </Link>
            </li>
            <li>
              <a
                href="#DASHBOARD"
                onClick={() => setDrawerOpen(false)}
                className="hover:text-green-500"
              >
                Resources
              </a>
            </li>
            <li>
              <a
                href="#USECASES"
                onClick={() => setDrawerOpen(false)}
                className="hover:text-green-500"
              >
                Use Cases
              </a>
            </li>
            <li>
              <a
                href="#BLOG"
                onClick={() => setDrawerOpen(false)}
                className="hover:text-green-500"
              >
                Blog
              </a>
            </li>
            <li>
              <a
                href="#PRICING"
                onClick={() => setDrawerOpen(false)}
                className="hover:text-green-500"
              >
                Pricing
              </a>
            </li>
            <li>
              <Link
                to="/signup"
                onClick={() => setDrawerOpen(false)}
                className="bg-green-500 text-white px-4 py-2 hover:bg-gray-900 transition rounded-lg block text-center"
              >
                Get Started
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default Navbar;
