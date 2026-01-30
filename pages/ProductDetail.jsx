import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, X, ArrowLeft, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import { cn } from '../lib/utils';

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();

    const [product, setProduct] = useState(null);
    const [images, setImages] = useState([]);
    const [variants, setVariants] = useState([]);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);

            // Fetch Product
            const { data: productData, error: pError } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .eq('is_active', true) // Only fetch if active
                .single();

            if (pError) {
                console.error('Error fetching product:', pError);
                setProduct(null);
            } else {
                setProduct(productData);

                // Fetch Variants
                const { data: variantsData, error: vError } = await supabase
                    .from('product_variants')
                    .select('*')
                    .eq('product_id', id);

                // Fetch Images
                const { data: imgsData } = await supabase
                    .from('product_images')
                    .select('*')
                    .eq('product_id', id)
                    .order('display_order', { ascending: true });

                if (imgsData && imgsData.length > 0) {
                    setImages(imgsData);
                } else if (productData.image_url) {
                    setImages([{ id: 'legacy', url: productData.image_url }]);
                }

                if (vError) {
                    console.error('Error fetching variants:', vError);
                } else {
                    setVariants(variantsData || []);
                    const firstAvailable = variantsData?.find(item => item.stock > 0);
                    if (firstAvailable) setSelectedVariant(firstAvailable);
                }
            }
            setLoading(false);
        }

        if (id) fetchProduct();
    }, [id]);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader className="animate-spin text-gray-400" /></div>;
    if (!product) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Product not found</div>;

    const isSoldOut = variants.every(v => v.stock === 0);
    // currentImageIndex moved up

    const mainImage = images.length > 0 ? images[currentImageIndex]?.url : product?.image_url;

    const handleAddToCart = () => {
        if (selectedVariant) {
            addToCart(product, selectedVariant.id, selectedVariant.size, quantity, selectedVariant.stock);
            navigate('/');
        }
    };

    const handleImageError = (e) => {
        e.target.src = "https://placehold.co/600x400?text=No+Image";
        e.target.onerror = null;
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row relative animate-in fade-in zoom-in-95 duration-300 border border-gray-100">

                {/* 返回按鈕 (手機版左上角箭頭) */}
                <button
                    onClick={() => navigate('/')}
                    className="md:hidden absolute top-4 left-4 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-gray-100 transition-colors border border-gray-200 flex items-center gap-1"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>

                {/* 關閉按鈕 (桌面版右上角X) */}
                <button
                    onClick={() => navigate('/')}
                    className="hidden md:block absolute top-4 right-4 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-gray-100 transition-colors border border-gray-200"
                >
                    <X className="w-5 h-5 text-gray-600" />
                </button>

                {/* 左側：圖片輪播 */}
                <div className="w-full md:w-1/2 h-96 md:h-auto bg-gray-100 relative group flex flex-col">
                    <div className="flex-1 relative overflow-hidden">
                        <img
                            src={mainImage}
                            alt={product.name}
                            className="w-full h-full object-cover transition-all duration-500"
                            onError={handleImageError}
                        />
                    </div>
                    {/* Thumbnails */}
                    {images.length > 1 && (
                        <div className="flex gap-2 p-4 overflow-x-auto bg-white border-t border-gray-100">
                            {images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentImageIndex(idx)}
                                    className={cn(
                                        "relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all",
                                        currentImageIndex === idx ? "border-black ring-2 ring-black/10" : "border-transparent opacity-70 hover:opacity-100 hover:border-gray-300"
                                    )}
                                >
                                    <img src={img.url} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* 右側：詳細資訊 */}
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col">
                    <div className="mb-auto">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">{product.name}</h2>
                        <p className="text-2xl font-bold text-gray-900 mb-6">NT$ {product.price.toLocaleString()}</p>

                        <div className="prose prose-sm text-gray-600 mb-8 leading-relaxed whitespace-pre-wrap">
                            {product.description || "這是一款精心設計的優質商品，採用頂級材質製作，適合各種場合穿搭。"}
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* 規格選擇 */}
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-bold text-gray-900">選擇尺寸</span>
                                {selectedVariant && (
                                    <span className={cn("text-xs font-medium", selectedVariant.stock < 5 ? "text-red-500" : "text-gray-500")}>
                                        庫存剩餘: {selectedVariant.stock}
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-3 flex-wrap">
                                {variants.map((v) => {
                                    const available = v.stock > 0;
                                    return (
                                        <button
                                            key={v.id}
                                            onClick={() => available && setSelectedVariant(v)}
                                            disabled={!available}
                                            className={cn(
                                                "px-4 py-2.5 rounded-lg text-sm font-medium border transition-all min-w-[3rem]",
                                                selectedVariant?.id === v.id
                                                    ? "border-black bg-black text-white shadow-md hover:bg-gray-800"
                                                    : "border-gray-200 text-gray-700 hover:border-gray-400 bg-white",
                                                !available && "opacity-40 cursor-not-allowed bg-gray-50 border-dashed"
                                            )}
                                        >
                                            {v.size}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 數量選擇 */}
                        <div className="flex items-end gap-4">
                            <div className="flex-1">
                                <span className="block text-sm font-bold text-gray-900 mb-3">購買數量</span>
                                <div className="flex items-center border border-gray-200 rounded-lg w-full max-w-[140px] bg-white">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="p-3 hover:bg-gray-50 text-gray-600 transition-colors"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="flex-1 text-center font-bold text-gray-900">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(Math.min((selectedVariant?.stock || 1), quantity + 1))}
                                        disabled={!selectedVariant || quantity >= selectedVariant.stock}
                                        className="p-3 hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 按鈕區 */}
                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    if (selectedVariant) {
                                        addToCart(product, selectedVariant.id, selectedVariant.size, quantity, selectedVariant.stock);
                                        navigate('/checkout');
                                    }
                                }}
                                disabled={!selectedVariant || isSoldOut}
                                className="flex-1 py-4 bg-white text-black border-2 border-black text-lg font-bold rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                立即購買
                            </button>
                            <button
                                onClick={handleAddToCart}
                                disabled={!selectedVariant || isSoldOut}
                                className="flex-1 py-4 bg-black text-white text-lg font-bold rounded-xl hover:bg-gray-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                            >
                                <ShoppingCart className="w-5 h-5" />
                                {isSoldOut ? '已售完' : '加入購物車'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
