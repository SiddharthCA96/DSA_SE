import React from "react";

const Header = ({ onLogout, onSearch }) => {
  const handleSearchClick = () => {
    const searchInput = document.getElementById("search-input").value;
    onSearch(searchInput); // Call the onSearch function with the input value
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
        onClick={onLogout}
        className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg">
        Logout
      </button>
    </header>
  );
};

export default Header;
