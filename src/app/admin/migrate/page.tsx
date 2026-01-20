'use client';

import { useState } from 'react';
import { initializeFirebase } from '@/firebase';
import { doc, setDoc, collection, writeBatch } from 'firebase/firestore';
import { artisans, products, categories } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

export default function MigratePage() {
  const [status, setStatus] = useState<'idle' | 'migrating' | 'success' | 'error'>('idle');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  const handleMigrate = async () => {
    setStatus('migrating');
    setLogs([]);
    addLog('Starting migration...');

    try {
      const { firestore } = initializeFirebase();
      const batch = writeBatch(firestore);
      let opCount = 0;
      const MAX_BATCH = 450; 

      // 1. Migrate Artisans to 'users' collection
      addLog(`Migrating ${artisans.length} artisans...`);
      for (const artisan of artisans) {
        const userRef = doc(firestore, 'users', artisan.id);
        const userData = {
          ...artisan,
          userType: 'artisan',
          role: 'artisan', // For backward compatibility with existing rules if any
          email: `artisan_${artisan.id}@example.com`, // Dummy email
          createdAt: new Date().toISOString()
        };
        batch.set(userRef, userData);
        opCount++;
      }

      // 2. Migrate Categories
      addLog(`Migrating ${categories.length} categories...`);
      for (const cat of categories) {
        // We can't store React components (icons) in Firestore
        // We'll strip the icon out or store the name
        const { icon, ...catData } = cat;
        const catRef = doc(firestore, 'categories', cat.id);
        
        // Use a string for icon name if needed, or just skip it
        const finalData = {
            ...catData,
            iconName: cat.name // Simplified
        };
        
        batch.set(catRef, finalData);
        opCount++;
      }

      // 3. Migrate Products
      addLog(`Migrating ${products.length} products...`);
      for (const product of products) {
        const productRef = doc(firestore, 'products', product.id);
        
        // Transform artisan object to ID for nicer referencing, 
        // but keep basic info for display if needed (denormalization)
        const { artisan, ...productRest } = product;
        
        const productData = {
            ...productRest,
            artisanId: artisan.id,
            artisanName: artisan.name,
            createdAt: new Date().toISOString()
        };
        
        batch.set(productRef, productData);
        opCount++;
      }
      
      if (opCount > 0) {
          await batch.commit();
          addLog(`Successfully committed ${opCount} operations.`);
      } else {
          addLog('No data to migrate.');
      }

      setStatus('success');
    } catch (error: any) {
      console.error(error);
      addLog(`Error: ${error.message}`);
      setStatus('error');
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Data Migration Utility</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            This utility helps migrate hardcoded mock data (artisans, products, categories)
            into the Firestore database.
          </p>
          
          <div className="bg-slate-100 p-4 rounded-md h-64 overflow-y-auto font-mono text-xs">
            {logs.length === 0 ? <span className="text-slate-400">Logs will appear here...</span> : logs.map((log, i) => <div key={i}>{log}</div>)}
          </div>

          <Button 
            onClick={handleMigrate} 
            disabled={status === 'migrating' || status === 'success'}
            className="w-full"
          >
            {status === 'migrating' ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Migrating...</>
            ) : status === 'success' ? (
                <><CheckCircle className="mr-2 h-4 w-4" /> Migration Complete</>
            ) : (
                <><AlertTriangle className="mr-2 h-4 w-4" /> Start Migration</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
