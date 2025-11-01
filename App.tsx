import React, { useState } from "react";
import { User } from "./types";
import LoginPage from "./pages/LoginPage";
import MainPage from "./pages/MainPage";

// --- Static Data ---
const initialUsers: User[] = [
  { id: 1, username: "admin", password: "admin123", role: "admin" },
  { id: 2, username: "user", password: "user123", role: "buyer" },
];

// --- Helper Functions ---
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const LandingPage: React.FC<{ onStartOrder: () => void }> = ({
  onStartOrder,
}) => {
  return (
    <div
      className="h-screen w-screen bg-cover bg-center flex flex-col items-center justify-center text-white"
      style={{
        backgroundImage:
          "url('https://i.pinimg.com/1200x/b4/81/6c/b4816c7561c47ab14d6a965bd8fad6f6.jpg')",
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      <div className="relative z-10 text-center p-4">
        <h1 className="text-7xl md:text-8xl font-bold drop-shadow-lg">
          SmartCafé
        </h1>
        <p className="text-xl md:text-2xl mt-4 max-w-2xl mx-auto drop-shadow-md">
          Pesan lebih cerdas dengan rekomendasi menu spesial dari asisten AI
          kami.
        </p>
        <button
          onClick={onStartOrder}
          className="mt-12 bg-amber-700 text-white font-bold text-xl py-4 px-10 rounded-full shadow-xl hover:bg-amber-800 transition-all duration-300 transform hover:scale-110"
        >
          Mulai Pesan
        </button>
      </div>
    </div>
  );
};

export default function App() {
  const [page, setPage] = useState<"landing" | "login" | "menu">("landing");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(initialUsers);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setPage("menu");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setPage("landing");
  };

  const handleSaveUser = (
    userData: Omit<User, "id" | "password"> & { id?: number; password?: string }
  ) => {
    if (userData.id) {
      // Update existing user
      setUsers((prevUsers) =>
        prevUsers.map((u) => {
          if (u.id === userData.id) {
            const updatedUser = {
              ...u,
              username: userData.username,
              role: userData.role,
              // Only update password if a new one is provided
              password: userData.password ? userData.password : u.password,
            };
            // if current user is updated, update currentUser state
            if (currentUser && currentUser.id === userData.id) {
              setCurrentUser(updatedUser);
            }
            return updatedUser;
          }
          return u;
        })
      );
    } else {
      // Add new user
      // Password must exist for new user, checked in form
      const newUser: User = {
        id: Date.now(),
        username: userData.username,
        password: userData.password!,
        role: userData.role,
      };
      setUsers((prev) => [...prev, newUser]);
    }
  };

  const handleDeleteUser = (userId: number) => {
    if (currentUser?.id === userId) {
      alert("You cannot delete the currently logged in user.");
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const renderPage = () => {
    switch (page) {
      case "landing":
        return <LandingPage onStartOrder={() => setPage("login")} />;
      case "login":
        return (
          <LoginPage
            users={users}
            onLogin={handleLogin}
            onBackToHome={() => setPage("landing")}
          />
        );
      case "menu":
        if (currentUser) {
          return (
            <MainPage
              user={currentUser}
              onLogout={handleLogout}
              users={users}
              onSaveUser={handleSaveUser}
              onDeleteUser={handleDeleteUser}
            />
          );
        }
        // Fallback to login if no user but page is 'menu'
        setPage("login");
        return (
          <LoginPage
            users={users}
            onLogin={handleLogin}
            onBackToHome={() => setPage("landing")}
          />
        );
      default:
        return <LandingPage onStartOrder={() => setPage("login")} />;
    }
  };

  return <>{renderPage()}</>;
}
