import React, { createContext, useState } from "react";

// ✅ Context үүсгэх — default object өгнө
export const BreadcrumbContext = createContext({
  selectedCategory: null,
  setSelectedCategory: () => {},
  selectedBrand: null,
  setSelectedBrand: () => {},
  selectedModel: null,
  setSelectedModel: () => {},
  productName: null,
  setProductName: () => {},
});

// ✅ Provider component
export const BreadcrumbProvider = ({ children }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [productName, setProductName] = useState(null);

  return (
    <BreadcrumbContext.Provider
      value={{
        selectedCategory,
        setSelectedCategory,
        selectedBrand,
        setSelectedBrand,
        selectedModel,
        setSelectedModel,
        productName,
        setProductName,
      }}
    >
      {children}
    </BreadcrumbContext.Provider>
  );
};