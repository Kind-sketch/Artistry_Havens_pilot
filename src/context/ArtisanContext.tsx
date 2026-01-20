
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { initializeFirebase, useUser } from '@/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import type { Product } from '@/lib/types';

export type OrderStatus = 'Processing' | 'Shipped' | 'Delivered';

export interface Order {
  id: string;
  product: Product;
  quantity: number;
  buyer: string;
  orderDate: string;
  status: OrderStatus;
}

interface ArtisanContextType {
  products: Product[];
  orders: Order[];
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
}

const ArtisanContext = createContext<ArtisanContextType | undefined>(undefined);

export function ArtisanProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!user) {
      setProducts([]);
      setOrders([]);
      return;
    }

    const { firestore } = initializeFirebase();

    // Subscribe to Products
    const qProducts = query(collection(firestore, 'products'), where('artisanId', '==', user.uid));
    const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
      const fetchedProducts: Product[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
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
          artisan: { // Construct partial artisan info as stored or needed
            id: data.artisanId,
            name: data.artisanName || 'Me',
            avatar: { url: '', hint: '' }
          }
        });
      });
      setProducts(fetchedProducts);
    });

    // Subscribe to Orders
    const qOrders = query(collection(firestore, 'orders'), where('artisanId', '==', user.uid));
    const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
      const fetchedOrders: Order[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedOrders.push({
          id: doc.id,
          product: data.product, // Assuming product object is stored in order, or we fetches. Ideally normalized.
          // For simplicity, assuming the order doc contains a snapshot of the product.
          quantity: data.quantity,
          buyer: data.buyerDisplayName || 'Unknown Buyer', // Use display name or ID
          orderDate: data.orderDate,
          status: data.status,
        });
      });
      setOrders(fetchedOrders);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeOrders();
    };
  }, [user]);

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const { firestore } = initializeFirebase();
      const orderRef = doc(firestore, 'orders', orderId);
      await updateDoc(orderRef, { status });
      // State updates via onSnapshot
    } catch (error) {
      console.error("Failed to update order status", error);
    }
  };

  const value = { products, orders, updateOrderStatus };

  return (
    <ArtisanContext.Provider value={value}>
      {children}
    </ArtisanContext.Provider>
  );
}

export function useArtisan() {
  const context = useContext(ArtisanContext);
  if (context === undefined) {
    throw new Error('useArtisan must be used within an ArtisanProvider');
  }
  return context;
}
