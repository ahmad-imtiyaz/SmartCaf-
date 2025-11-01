import React, { useState, FormEvent } from "react";
import { User } from "../types";

interface LoginPageProps {
  users: User[];
  onLogin: (user: User) => void;
  onBackToHome: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({
  users,
  onLogin,
  onBackToHome,
}) => {
  const [isBuyerPanelActive, setIsBuyerPanelActive] = useState(true);

  const [buyerUsername, setBuyerUsername] = useState("");
  const [buyerPassword, setBuyerPassword] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: FormEvent, role: "buyer" | "admin") => {
    e.preventDefault();
    setError("");
    const username = role === "buyer" ? buyerUsername : adminUsername;
    const password = role === "buyer" ? buyerPassword : adminPassword;

    const foundUser = users.find(
      (u) =>
        u.username === username && u.password === password && u.role === role
    );

    if (foundUser) {
      onLogin(foundUser);
    } else {
      setError("Username atau password salah.");
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen flex flex-col items-center justify-center font-sans p-4 relative">
      <button
        onClick={onBackToHome}
        className="absolute top-6 left-6 text-amber-900 font-semibold hover:underline z-10"
      >
        &larr; Kembali ke Beranda
      </button>
      <div
        className={`
                bg-white rounded-xl shadow-2xl relative overflow-hidden w-full max-w-4xl min-h-[520px]
                transition-all duration-700 ease-in-out
            `}
      >
        {/* Form Container */}
        <div
          className={`
                    absolute top-0 h-full w-1/2 left-0
                    transition-all duration-700 ease-in-out
                    ${
                      isBuyerPanelActive
                        ? "opacity-100 z-20"
                        : "opacity-0 z-10 pointer-events-none"
                    }`}
        >
          <form
            onSubmit={(e) => handleLogin(e, "buyer")}
            className="bg-white h-full flex flex-col justify-center items-center px-12"
          >
            <h1 className="text-3xl font-bold text-amber-900 mb-6">
              Login Pembeli
            </h1>
            <input
              type="text"
              placeholder="Username"
              value={buyerUsername}
              onChange={(e) => setBuyerUsername(e.target.value)}
              className="bg-gray-100 w-full p-3 mb-3 rounded-md border-2 border-transparent focus:border-amber-500 focus:outline-none"
            />
            <input
              type="password"
              placeholder="Password"
              value={buyerPassword}
              onChange={(e) => setBuyerPassword(e.target.value)}
              className="bg-gray-100 w-full p-3 mb-4 rounded-md border-2 border-transparent focus:border-amber-500 focus:outline-none"
            />
            {error && isBuyerPanelActive && (
              <p className="text-red-500 text-sm mb-4">{error}</p>
            )}
            <button
              type="submit"
              className="bg-amber-800 text-white font-bold py-3 px-10 rounded-full hover:bg-amber-900 transition-colors uppercase tracking-wider"
            >
              Login
            </button>
          </form>
        </div>

        <div
          className={`
                    absolute top-0 h-full w-1/2 left-0
                    transition-all duration-700 ease-in-out
                    ${
                      !isBuyerPanelActive
                        ? "opacity-100 z-20 transform translate-x-full"
                        : "opacity-0 z-10 pointer-events-none"
                    }`}
        >
          <form
            onSubmit={(e) => handleLogin(e, "admin")}
            className="bg-white h-full flex flex-col justify-center items-center px-12"
          >
            <h1 className="text-3xl font-bold text-amber-900 mb-6">
              Login Admin
            </h1>
            <input
              type="text"
              placeholder="Username"
              value={adminUsername}
              onChange={(e) => setAdminUsername(e.target.value)}
              className="bg-gray-100 w-full p-3 mb-3 rounded-md border-2 border-transparent focus:border-amber-500 focus:outline-none"
            />
            <input
              type="password"
              placeholder="Password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="bg-gray-100 w-full p-3 mb-4 rounded-md border-2 border-transparent focus:border-amber-500 focus:outline-none"
            />
            {error && !isBuyerPanelActive && (
              <p className="text-red-500 text-sm mb-4">{error}</p>
            )}
            <button
              type="submit"
              className="bg-amber-800 text-white font-bold py-3 px-10 rounded-full hover:bg-amber-900 transition-colors uppercase tracking-wider"
            >
              Login
            </button>
          </form>
        </div>

        {/* Overlay Container */}
        <div
          className={`
    absolute top-0 left-1/2 w-1/2 h-full overflow-hidden z-50
    transition-all duration-700 ease-in-out
    ${!isBuyerPanelActive ? "transform -translate-x-full" : ""}
  `}
        >
          <div
            className={`
      bg-gradient-to-br from-amber-700 to-amber-900 text-white relative h-full w-[200%]
      transform transition-all duration-700 ease-in-out
      ${isBuyerPanelActive ? "translate-x-0" : "translate-x-[-50%]"}
    `}
          >
            {/* Panel Admin (kiri) */}
            <div
              className={`
        absolute top-0 left-0 h-full w-1/2 flex flex-col items-center justify-center text-center px-10
        transition-all duration-700 ease-in-out
      `}
            >
              <h2 className="text-3xl font-bold mb-4">Admin SmartCafé?</h2>
              <p className="mb-6">
                Login di sini untuk mengelola menu dan melihat pesanan.
              </p>
              <button
                onClick={() => {
                  setIsBuyerPanelActive(false);
                  setError("");
                }}
                className="bg-transparent border-2 border-white font-bold py-2 px-8 rounded-full hover:bg-white hover:text-amber-900 transition-colors uppercase tracking-wider"
              >
                Login Admin
              </button>
            </div>

            {/* Panel Pembeli (kanan) */}
            <div
              className={`
        absolute top-0 left-1/2 h-full w-1/2 flex flex-col items-center justify-center text-center px-10
        transition-all duration-700 ease-in-out
      `}
            >
              <h2 className="text-3xl font-bold mb-4">Selamat Datang!</h2>
              <p className="mb-6">
                Silakan login untuk mulai memesan menu favorit Anda.
              </p>
              <button
                onClick={() => {
                  setIsBuyerPanelActive(true);
                  setError("");
                }}
                className="bg-transparent border-2 border-white font-bold py-2 px-8 rounded-full hover:bg-white hover:text-amber-900 transition-colors uppercase tracking-wider"
              >
                Login Pembeli
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
