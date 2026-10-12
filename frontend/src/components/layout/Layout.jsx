import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

const Layout = ({ children }) => {
  return (
    <>
      <Navbar></Navbar>
      <main style={{ minHeight: "calc(100vh - 300px)" }}>{children}</main>
      <Footer></Footer>
    </>
  );
};

export default Layout;
