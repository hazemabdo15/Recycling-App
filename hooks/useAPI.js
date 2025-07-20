import { useEffect, useState } from 'react';
import { categoriesAPI } from '../services/api';
export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await categoriesAPI.getAllCategories();
      setCategories(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchCategories();
  }, []);
  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
  };
};
export const useAllItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchAllItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await categoriesAPI.getAllItems();
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchAllItems();
  }, []);
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
  useEffect(() => {
    const fetchCategoryItems = async () => {
      if (!categoryName) return;
      try {
        setLoading(true);
        setError(null);
        const data = await categoriesAPI.getCategoryItems(categoryName);
        setItems(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCategoryItems();
  }, [categoryName]);
  const refetch = async () => {
    if (!categoryName) return;
    try {
      setLoading(true);
      setError(null);
      const data = await categoriesAPI.getCategoryItems(categoryName);
      setItems(data);
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

