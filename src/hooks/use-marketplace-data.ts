import { useState, useEffect } from 'react';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import type { Product, Artisan, Category } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Palette, Gem, Brush, Hammer, Scissors, ShoppingBag, VenetianMask, SprayCan } from 'lucide-react';

// Re-map icons as they are not stored in DB
const categoryIcons: { [key: string]: React.ElementType } = {
    'Textiles': Scissors,
    'Sculpture': VenetianMask,
    'Woodwork': Hammer,
    'Metalwork': SprayCan,
    'Paintings': Brush,
    'Pottery': Palette,
    'Jewelry': Gem,
    'Default': ShoppingBag,
};

export function useMarketplaceData() {
    const [products, setProducts] = useState<Product[]>([]);
    const [artisans, setArtisans] = useState<Artisan[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const { firestore } = initializeFirebase();

                // Fetch Artisans
                const artisansSnap = await getDocs(collection(firestore, 'users'));
                // Note: In real app, filter by userType='artisan'. 
                // For now, assuming only artisans (or consistent with data migration)
                // If 'users' has buyers too, we need a query.
                // Let's assume the migration put them in 'users' with userType='artisan'
                // But here we might get valid users.
                // For simplicity/safety vs existing mock, let's just fetch all 'users' 
                // and filter in memory if needed, or query.
                // Querying requires an index potentially.
                // I will just fetch 'users' and map.

                const fetchedArtisans: Artisan[] = [];
                artisansSnap.forEach(doc => {
                    const data = doc.data();
                    if (data.userType === 'artisan' || data.role === 'artisan') {
                        fetchedArtisans.push({
                            id: doc.id,
                            name: data.name,
                            avatar: data.avatar || { url: '', hint: '' },
                            crafts: data.crafts,
                            phone: data.phone
                        });
                    }
                });

                // Fetch Categories
                const categoriesSnap = await getDocs(collection(firestore, 'categories'));
                const fetchedCategories: Category[] = [];
                categoriesSnap.forEach(doc => {
                    const data = doc.data();
                    fetchedCategories.push({
                        id: doc.id,
                        name: data.name,
                        icon: categoryIcons[data.name] || categoryIcons['Default']
                    });
                });

                // Fetch Products
                const productsSnap = await getDocs(collection(firestore, 'products'));
                const fetchedProducts: Product[] = [];
                productsSnap.forEach(doc => {
                    const data = doc.data();
                    // Reconstruct artisan object if needed or find in fetchedArtisans
                    // The UI expects nested artisan object
                    const artisan = fetchedArtisans.find(a => a.id === data.artisanId) || {
                        id: data.artisanId,
                        name: data.artisanName || 'Unknown',
                        avatar: { url: '', hint: '' }
                    };

                    fetchedProducts.push({
                        id: doc.id,
                        name: data.name,
                        price: data.price,
                        image: data.image,
                        category: data.category,
                        description: data.description,
                        likes: data.likes || 0,
                        sales: data.sales || 0,
                        reviews: data.reviews,
                        story: data.story,
                        artisan: artisan
                    });
                });

                setArtisans(fetchedArtisans);
                setCategories(fetchedCategories);
                setProducts(fetchedProducts);
            } catch (e: any) {
                console.error("Failed to fetch marketplace data:", e);
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    return { products, artisans, categories, loading, error };
}
