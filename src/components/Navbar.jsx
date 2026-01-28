import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { CONFIG } from '../config';

export default function Navbar() {
    const { totalItems } = useCart();
    const navigate = useNavigate();

    return (
        <nav className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100 transition-all">
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                <div
                    className="flex items-center gap-2 cursor-pointer group"
                    onClick={() => navigate('/')}
                >
                    <div className="w-8 h-8 bg-black text-white flex items-center justify-center font-bold text-lg rounded group-hover:bg-gray-800 transition-colors">
                        {CONFIG.STORE_ICON}
                    </div>
                    <span className="text-xl font-bold tracking-tight text-gray-900 group-hover:text-gray-600 transition-colors">
                        {CONFIG.STORE_NAME}
                    </span>
                </div>

                <div
                    className="relative cursor-pointer p-2 hover:bg-gray-100 rounded-full transition-colors"
                    onClick={() => navigate('/cart')}
                >
                    <ShoppingCart className="w-6 h-6 text-gray-700" />
                    {totalItems > 0 && (
                        <span className="absolute top-0 right-0 bg-black text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white transform translate-x-1 -translate-y-1">
                            {totalItems}
                        </span>
                    )}
                </div>
            </div>
        </nav>
    );
}
