import React from "react";
import Header from "./Header";
import { useNavigate } from "react-router-dom";

export const Home = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/signin");
  };

  return (
    <div className="absolute w-full">
      <>
        <Header onLogout={handleLogout} />
      </>
    </div>
  );
};
