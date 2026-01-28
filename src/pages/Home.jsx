import React, { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Home() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) console.error('Error fetching products:', error);
            else setProducts(data);
            setLoading(false);
        }

        fetchProducts();
    }, []);

    const handleImageError = (e) => {
        e.target.src = "https://placehold.co/600x400?text=No+Image";
        e.target.onerror = null;
    };

    return (
        <div className="min-h-screen pb-20 bg-gray-50">
            {/* Hero Banner */}
            <section className="bg-white pt-12 pb-16 px-4 mb-8 border-b border-gray-100">
                <div className="max-w-6xl mx-auto text-center">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-700">
                        定義你的專屬風格
                    </h1>
                    <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
                        精選本季最新潮流單品，從休閒舒適到都會機能，全館滿額免運優惠中。
                    </p>
                    <button
                        onClick={() => document.getElementById('products').scrollIntoView({ behavior: 'smooth' })}
                        className="px-10 py-4 bg-black text-white font-bold rounded-full hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 animate-in fade-in zoom-in duration-500 delay-200"
                    >
                        查看新品
                    </button>
                </div>
            </section>

            {/* 商品展示區 */}
            <section id="products" className="max-w-6xl mx-auto px-4">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">熱銷推薦</h2>
                    <span className="text-gray-500 text-sm font-medium">共 {products.length} 件商品</span>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                        {products.map((product) => (
                            <div
                                key={product.id}
                                onClick={() => navigate(`/product/${product.id}`)}
                                className="group bg-white rounded-xl md:rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 cursor-pointer flex flex-col"
                            >
                                <div className="aspect-square overflow-hidden bg-gray-100 relative">
                                    <img
                                        src={product.image_url}
                                        alt={product.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                        onError={handleImageError}
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                                    <button className="absolute bottom-2 right-2 md:bottom-4 md:right-4 bg-white p-2 md:p-3 rounded-full shadow-lg translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hover:bg-gray-50">
                                        <ShoppingCart className="w-4 h-4 md:w-5 md:h-5 text-black" />
                                    </button>
                                </div>
                                <div className="p-3 md:p-5 flex-1 flex flex-col">
                                    <h3 className="font-bold text-gray-900 text-sm md:text-lg mb-1 line-clamp-2 group-hover:text-gray-600 transition-colors">{product.name}</h3>
                                    <div className="mt-auto flex items-center justify-between pt-2 md:pt-4 min-w-0">
                                        <span className="font-bold text-sm md:text-lg text-gray-900 truncate whitespace-nowrap">NT$ {product.price.toLocaleString()}</span>
                                        <span className="hidden lg:inline text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md flex-shrink-0 ml-2">查看詳情</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
