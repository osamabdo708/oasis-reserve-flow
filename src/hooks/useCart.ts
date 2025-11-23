import { useState, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock: number;
  category: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export const useCart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    // Load cart from localStorage on mount
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Save cart to localStorage whenever it changes
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product, quantity: number = 1) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity + quantity > product.stock) {
        return { success: false, message: "المخزون غير كافٍ" };
      }
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      if (quantity > product.stock) {
        return { success: false, message: "المخزون غير كافٍ" };
      }
      setCart([...cart, { ...product, quantity }]);
    }
    return { success: true, message: "تمت الإضافة للسلة" };
  };

  const updateQuantity = (productId: string, change: number) => {
    const item = cart.find(item => item.id === productId);
    if (!item) return { success: false, message: "المنتج غير موجود" };

    const newQuantity = item.quantity + change;
    
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return { success: true, message: "تم حذف المنتج من السلة" };
    }

    if (newQuantity > item.stock) {
      return { success: false, message: "المخزون غير كافٍ" };
    }

    setCart(cart.map(item =>
      item.id === productId
        ? { ...item, quantity: newQuantity }
        : item
    ));
    return { success: true, message: "تم تحديث الكمية" };
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  return {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartCount,
    getSubtotal,
  };
};
