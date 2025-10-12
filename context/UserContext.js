// context/UserContext.js
import { createContext, useContext, useState } from "react";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState({
    name: "Mae Anne Tullao",
    email: "maeanne@gmail.com",
    pets: [
      { name: "Buddy", animal: "Dog", breed: "Shih Tzu" },
      { name: "Mochi", animal: "Cat", breed: "Persian" },
      { name: "Bunbun", animal: "Rabbit", breed: "Lionhead" },
    ],
  });

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
