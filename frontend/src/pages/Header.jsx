import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
const Header = ({setSearchResults,setQueryFlag}) => {
  const navigate = useNavigate();
  //logout function
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/signin");
  };

  //handlesearchclick function
  const handleSearchClick = async () => {
    const searchInput = document.getElementById("search-input").value;
    //call the route to get top 10 related questions from here
    try {
      console.log("Given query:", searchInput);
      const response = await axios.post(
        "http://localhost:3000/api/auth/topResults",
        {
          searchInput,
        }
      );
      console.log(typeof(response.data));
      setSearchResults(response.data);
      setQueryFlag(true);
    } catch (error) {
      console.error(
        "top results fetch error:",
        error.response?.data || error.message
      );
      alert(
        "topresults fetch. Error: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  return (
    <header className="bg-teal-700 text-white py-4 px-6 flex items-center justify-between">
      <div className="flex items-center space-x-2 w-1/2">
        <input
          id="search-input"
          type="text"
          placeholder="Search..."
          className="w-full p-2 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <button
          onClick={handleSearchClick}
          className="bg-purple-400 hover:bg-purple-800 text-white py-2 px-4 rounded-lg">
          Search
        </button>
      </div>
      <button
        onClick={handleLogout}
        className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg">
        Logout
      </button>
    </header>
  );
};

export default Header;
