import React from 'react';
import { ShoppingCart, Trash2, Minus, Plus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Cart() {
    const { cart, removeFromCart, updateQty, totalPrice } = useCart();
    const navigate = useNavigate();

    const handleImageError = (e) => {
        e.target.src = "https://placehold.co/600x400?text=No+Image";
        e.target.onerror = null;
    };

    if (cart.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
                        <ShoppingCart className="w-10 h-10" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">購物車是空的</h2>
                    <p className="text-gray-500 mb-8">看起來您還沒有選購任何商品</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-8 py-3 bg-black text-white font-bold rounded-full hover:bg-gray-800 transition-colors"
                    >
                        去逛逛
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 md:py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* 返回按鈕 (手機版) */}
                <button
                    onClick={() => navigate('/')}
                    className="md:hidden flex items-center text-gray-500 hover:text-black mb-4 transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                    返回
                </button>

                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 md:mb-8 flex items-center gap-3">
                    購物車 <span className="text-sm font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded-full">{cart.length}</span>
                </h2>

                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="flex-1 space-y-4">
                        {cart.map((item, index) => (
                            <div key={`${item.variantId}-${index}`} className="flex gap-4 p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                                <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                    <img src={item.image_url} className="w-full h-full object-cover" onError={handleImageError} alt={item.name} />
                                </div>
                                <div className="flex-1 flex flex-col justify-between py-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-gray-900">{item.name}</h3>
                                            <p className="text-sm text-gray-500 mt-1">尺寸: {item.size}</p>
                                        </div>
                                        <button onClick={() => removeFromCart(item.variantId)} className="text-gray-400 hover:text-red-500 p-1">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center border border-gray-200 rounded-lg h-8">
                                            <button onClick={() => updateQty(item.variantId, -1)} className="px-2 h-full hover:bg-gray-50 text-gray-600"><Minus className="w-3 h-3" /></button>
                                            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQty(item.variantId, 1)}
                                                disabled={item.quantity >= (item.stock || 999)}
                                                className="px-2 h-full hover:bg-gray-50 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <span className="font-bold text-gray-900">NT$ {(item.price * item.quantity).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="lg:w-80 h-fit bg-white border border-gray-100 rounded-2xl p-6 shadow-sm sticky top-24">
                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-gray-500"><span>小計</span><span>NT$ {totalPrice.toLocaleString()}</span></div>
                            <div className="flex justify-between text-gray-900 font-bold text-lg pt-3 border-t border-gray-100"><span>總額</span><span>NT$ {totalPrice.toLocaleString()}</span></div>
                        </div>
                        <button
                            onClick={() => navigate('/checkout')}
                            className="w-full py-4 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-lg"
                        >
                            前往結帳
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
