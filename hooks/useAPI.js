import { useCallback, useEffect, useState } from "react";
import { categoriesAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await categoriesAPI.getAllCategories(user?.role || "customer");
      console.log("[useAPI] Fetched categories:", data);
      setCategories(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.role]);
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);
  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
  };
};
export const useAllItems = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchAllItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await categoriesAPI.getAllItems(user?.role || "customer");

      const itemsArray = data.data?.items || data.items;
      setItems(Array.isArray(itemsArray) ? itemsArray : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    fetchAllItems();
  }, [fetchAllItems]);
  return {
    items,
    loading,
    error,
    refetch: fetchAllItems,
  };
};
export const useCategoryItems = (categoryName) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  useEffect(() => {
    const fetchCategoryItems = async () => {
      if (!categoryName) return;
      try {
        setLoading(true);
        setError(null);
        const data = await categoriesAPI.getCategoryItems(
          user?.role || "customer",
          categoryName
        );
        setItems(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCategoryItems();
  }, [categoryName, user?.role]);
  const refetch = async () => {
    if (!categoryName) return;
    try {
      setLoading(true);
      setError(null);
      const data = await categoriesAPI.getCategoryItems(
        user?.role || "customer",
        categoryName
      );
      setItems(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  return {
    items,
    loading,
    error,
    refetch,
  };
};
