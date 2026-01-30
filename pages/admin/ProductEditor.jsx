import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Upload, X, Plus, Loader, ArrowLeft, Save } from 'lucide-react'
import { CONFIG } from '../../config'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';


// Sortable Image Item Component
function SortableImage({ id, url, index, onRemove }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 20 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="relative group aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200 cursor-move touch-none"
        >
            <img src={url} alt={`Product ${index}`} className="h-full w-full object-cover block pointer-events-none" />
            <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()} // Prevent drag start when clicking delete
                onClick={() => onRemove(index)}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10 hover:bg-red-600"
            >
                <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-1 text-center pointer-events-none">
                {index === 0 ? '封面圖' : `順序 ${index}`}
            </div>
        </div>
    );
}

export default function ProductEditor() {
    const { id } = useParams()
    const isEdit = !!id
    const navigate = useNavigate()

    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        image_url: '',
        description: '',
        is_active: true
    })
    const [variants, setVariants] = useState([{ size: 'F', stock: 10 }])
    const [images, setImages] = useState([]) // New state for multiple images
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true)
            const { data: product } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .single()

            const { data: vs } = await supabase
                .from('product_variants')
                .select('*')
                .eq('product_id', id)

            if (product) {
                setFormData(product)
                if (vs && vs.length > 0) {
                    setVariants(vs)
                }

                // Fetch Images
                const { data: imgs } = await supabase
                    .from('product_images')
                    .select('*')
                    .eq('product_id', id)
                    .order('display_order', { ascending: true })

                if (imgs && imgs.length > 0) {
                    setImages(imgs)
                } else if (product.image_url) {
                    // Fallback for legacy data if migration script wasn't run or partial
                    setImages([{ id: 'legacy', url: product.image_url, display_order: 0 }])
                }
            }
            setLoading(false)
        }

        if (isEdit) {
            fetchProduct()
        }
    }, [id, isEdit])

    const handleImageUpload = async (e) => {
        try {
            setUploading(true)
            const files = Array.from(e.target.files)
            if (files.length === 0) return

            const newImages = []

            for (const file of files) {
                const fileExt = file.name.split('.').pop()
                const fileName = `${Math.random()}.${fileExt}`
                const filePath = `${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('product-images')
                    .upload(filePath, file)

                if (uploadError) throw uploadError

                const { data } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(filePath)

                newImages.push({
                    id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    url: data.publicUrl
                })
            }

            // Pending images (not saved to DB yet, will be saved on Submit)
            setImages([...images, ...newImages])
        } catch (error) {
            alert('圖片上傳失敗 (請確認已登入且有權限): ' + error.message)
        } finally {
            setUploading(false)
        }
    }

    const removeImage = (index) => {
        setImages(images.filter((_, i) => i !== index))
    }

    const handleVariantChange = (index, field, value) => {
        const newVariants = [...variants]
        newVariants[index][field] = value
        setVariants(newVariants)
    }

    const addVariant = () => {
        setVariants([...variants, { size: '', stock: 0 }])
    }

    const removeVariant = (index) => {
        setVariants(variants.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        const sizes = variants.map(v => v.size.trim())
        const uniqueSizes = new Set(sizes)
        if (uniqueSizes.size !== sizes.length) {
            alert('錯誤：規格尺寸 (Size) 不能重複，請檢查並修正。')
            return
        }

        setLoading(true)

        try {
            let productId = id

            const productData = {
                name: formData.name,
                price: parseInt(formData.price),
                // image_url: formData.image_url, // No longer directly setting this from state, logic moved to side effect
                description: formData.description,
                is_active: formData.is_active
            }

            if (isEdit) {
                const { error } = await supabase.from('products').update(productData).eq('id', id)
                if (error) throw error
            } else {
                const { data, error } = await supabase.from('products').insert(productData).select().single()
                if (error) throw error
                productId = data.id
            }

            if (isEdit) {
                await supabase.from('product_variants').delete().eq('product_id', productId)
            }

            const insertData = variants.map(v => ({
                product_id: productId,
                size: v.size,
                stock: parseInt(v.stock)
            }))

            if (insertData.length > 0) {
                const { error: variantError } = await supabase
                    .from('product_variants')
                    .insert(insertData)
                if (variantError) throw variantError
            }

            // Image Logic
            // 1. Delete existing images relations (simple approach)
            if (isEdit) {
                await supabase.from('product_images').delete().eq('product_id', productId)
            }

            // 2. Insert new relations
            const imageInserts = images.map((img, idx) => ({
                product_id: productId,
                url: img.url,
                display_order: idx
            }))

            if (imageInserts.length > 0) {
                const { error: imgError } = await supabase
                    .from('product_images')
                    .insert(imageInserts)
                if (imgError) throw imgError

                // Update the legacy image_url column with the first image for backward compatibility
                await supabase
                    .from('products')
                    .update({ image_url: imageInserts[0].url })
                    .eq('id', productId)
            } else {
                // Clear legacy image if no images
                await supabase
                    .from('products')
                    .update({ image_url: null })
                    .eq('id', productId)
            }

            navigate(`${CONFIG.ADMIN_PATH}/products`)
        } catch (error) {
            console.error('Submit Error:', error)
            alert('儲存失敗: ' + (error.message || '未知錯誤'))
        } finally {
            setLoading(false)
        }
    }



    // Sensors configuration
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setImages((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-10">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(`${CONFIG.ADMIN_PATH}/products`)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </button>
                <h2 className="text-2xl font-bold text-gray-900">{isEdit ? '編輯商品' : '新增商品'}</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Info */}
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">基本資訊</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 space-y-2">
                            <label className="block text-sm font-bold text-gray-700">商品名稱</label>
                            <input
                                type="text"
                                required
                                className="block w-full border border-gray-200 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-700">價格</label>
                            <input
                                type="number"
                                required
                                min="0"
                                className="block w-full border border-gray-200 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                            />
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <label className="block text-sm font-bold text-gray-700">商品描述</label>
                            <textarea
                                rows="4"
                                className="block w-full border border-gray-200 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all resize-none"
                                value={formData.description || ''}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <label className="block text-sm font-bold text-gray-700">商品圖片 (可多張)</label>

                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={images.map(img => img.id)}
                                    strategy={rectSortingStrategy}
                                >
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                                        {images.map((img, idx) => (
                                            <SortableImage
                                                key={img.id}
                                                id={img.id}
                                                url={img.url}
                                                index={idx}
                                                onRemove={removeImage}
                                            />
                                        ))}

                                        <label className="cursor-pointer aspect-square flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-100 hover:border-gray-400 transition-all">
                                            <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                            <span className="text-sm text-gray-500 font-medium">
                                                {uploading ? '上傳中...' : '新增圖片'}
                                            </span>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                multiple
                                                onChange={handleImageUpload}
                                                disabled={uploading}
                                            />
                                        </label>
                                    </div>
                                </SortableContext>
                            </DndContext>
                            <p className="mt-2 text-xs text-gray-500">第一張將作為封面圖。拖曳圖片即可調整顯示順序。</p>
                        </div>
                    </div>
                </div>

                {/* Variants */}
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-900">規格與庫存</h3>
                        <button type="button" onClick={addVariant} className="text-sm font-bold text-blue-600 hover:text-blue-500 flex items-center bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                            <Plus className="w-4 h-4 mr-1" /> 新增規格
                        </button>
                    </div>

                    <div className="space-y-3">
                        {variants.map((variant, idx) => (
                            <div key={idx} className="flex gap-4 items-start p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="flex-1 space-y-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase">尺寸/規格</label>
                                    <input
                                        type="text"
                                        required
                                        className="block w-full border border-gray-200 rounded-lg shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                        value={variant.size}
                                        onChange={e => handleVariantChange(idx, 'size', e.target.value)}
                                        placeholder="例如: S, M, XL"
                                    />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase">庫存數量</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        className="block w-full border border-gray-200 rounded-lg shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                        value={variant.stock}
                                        onChange={e => handleVariantChange(idx, 'stock', e.target.value)}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeVariant(idx)}
                                    className="mt-6 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full md:w-auto inline-flex items-center justify-center py-4 px-8 border border-transparent shadow-lg text-lg font-bold rounded-xl text-white bg-black hover:bg-gray-800 transition-all hover:-translate-y-0.5"
                    >
                        {loading ? <Loader className="animate-spin w-5 h-5 mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                        {loading ? '處理中...' : '儲存變更'}
                    </button>
                </div>
            </form>
        </div>
    )
}
