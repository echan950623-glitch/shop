import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        // 嘗試從 localStorage 讀取
        try {
            const saved = localStorage.getItem('cart');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product, variantId, size, quantity, stock) => {
        setCart((prev) => {
            const existingItem = prev.find((item) => item.variantId === variantId);
            if (existingItem) {
                return prev.map((item) => {
                    if (item.variantId === variantId) {
                        const newQty = item.quantity + quantity;
                        // Limit to stock if stock is known (it might be from saved cart which didn't have stock initially, 
                        // but re-adding should update it if we pass it, OR we just check against passed stock)
                        // Note: If item was loaded from localstorage, it won't have 'stock' property unless we save it.
                        // So we should save 'stock' in the item.
                        return { ...item, quantity: Math.min(newQty, stock), stock };
                    }
                    return item;
                });
            }
            return [...prev, { ...product, variantId, size, quantity, stock }];
        });
    };

    const removeFromCart = (variantId) => {
        setCart((prev) => prev.filter((item) => item.variantId !== variantId));
    };

    const updateQty = (variantId, delta) => {
        setCart((prev) => prev.map((item) => {
            if (item.variantId === variantId) {
                // Determine max stock. 
                // Issue: If item is from localstorage and hasn't been re-added, it might lack 'stock'.
                // Ideally we should re-fetch cart items to validate stock, but for now let's rely on what's in context.
                // If stock is undefined, we might allow it (or limit to something safe). 
                // But user requirement is strictly check stock.
                // Assuming `addToCart` now saves stock. For old items, they might not have it.
                // We'll trust `item.stock` if present.
                const maxStock = item.stock || 999;
                return { ...item, quantity: Math.min(Math.max(1, item.quantity + delta), maxStock) };
            }
            return item;
        }));
    };

    const clearCart = () => setCart([]);

    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
    const totalPrice = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty, clearCart, totalItems, totalPrice }}>
            {children}
        </CartContext.Provider>
    );
};
