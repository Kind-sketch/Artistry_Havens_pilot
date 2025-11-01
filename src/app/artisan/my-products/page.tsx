
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreVertical, Edit, Trash2, Film, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from '@/context/translation-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import TutorialDialog from '@/components/tutorial-dialog';
import { generateAdvertisement } from '@/ai/flows/generate-advertisement';

export default function MyProductsPage() {
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const { translations } = useTranslation();
  const t = translations.my_products_page;
  const { toast } = useToast();

  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isGeneratingAd, setIsGeneratingAd] = useState(false);
  const [advertisement, setAdvertisement] = useState<{ videoUrl: string; audioUrl: string } | null>(null);
  const [adDialogOpen, setAdDialogOpen] = useState(false);


  useEffect(() => {
    const storedProducts = JSON.parse(localStorage.getItem('myArtisanProducts') || '[]');
    setMyProducts(storedProducts);
  }, []);

  const handleCreateAdvertisement = async () => {
    if (myProducts.length < 3) {
      toast({
        variant: 'destructive',
        title: 'Not enough products',
        description: 'You need at least 3 products to create an advertisement.',
      });
      return;
    }
    
    setIsGeneratingAd(true);
    setAdvertisement(null);
    setAdDialogOpen(true);

    try {
      const latestThreeProducts = myProducts.slice(0, 3);
      const artisanProfile = JSON.parse(localStorage.getItem('artisanProfile') || '{}');
      const artisanName = artisanProfile.name || 'a talented artisan';

      const result = await generateAdvertisement({
        artisanName,
        products: latestThreeProducts.map(p => ({
            name: p.name,
            description: p.description,
            imageDataUri: p.image.url,
        }))
      });
      
      setAdvertisement({ videoUrl: result.videoDataUri, audioUrl: result.audioDataUri });
      toast({
        title: 'Advertisement Created!',
        description: 'Your video is ready to be viewed.',
      });
    } catch (error) {
      console.error('Advertisement generation failed:', error);
      toast({
        variant: 'destructive',
        title: 'Ad Generation Failed',
        description: 'Could not create the advertisement at this time. Please try again later.',
      });
       setAdDialogOpen(false);
    } finally {
      setIsGeneratingAd(false);
    }
  };

  const formatTimeAgo = (date: string) => {
    try {
      const distance = formatDistanceToNow(new Date(date));
      if (translations.add_product_page.cameraError.includes('Error')) { // A simple check for English
          return `Added ${distance} ago`;
      }
      // A simple placeholder for other languages.
      return `${t.added} ${distance} ${t.ago}`;
    } catch (e) {
      return t.justAdded;
    }
  }

  const handleDeleteProduct = () => {
    if (!productToDelete) return;

    const updatedProducts = myProducts.filter(p => p.id !== productToDelete.id);
    setMyProducts(updatedProducts);
    localStorage.setItem('myArtisanProducts', JSON.stringify(updatedProducts));

    toast({
      title: t.deleteToastTitle,
      description: t.deleteToastDescription.replace('{productName}', productToDelete.name),
    });

    setProductToDelete(null); // Close the dialog
  };

  return (
    <>
      <div className="container mx-auto p-4 relative">
        <TutorialDialog pageId="my-products" />
        <header className="mb-6 flex items-center justify-between mt-12">
          <div>
            <h1 className="font-headline text-3xl font-bold">{t.title}</h1>
            <p className="text-sm text-muted-foreground">{t.description}</p>
          </div>
           <Button onClick={handleCreateAdvertisement} disabled={isGeneratingAd || myProducts.length < 3}>
              {isGeneratingAd ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating Ad</>
              ) : (
                <><Film className="mr-2 h-4 w-4" />Create Ad</>
              )}
            </Button>
        </header>

        {myProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {myProducts.map(product => (
              <Card key={product.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative aspect-[3/4] w-full">
                    <Image
                      src={product.image.url}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                </CardContent>
                <CardHeader className="p-2 sm:p-3">
                  <CardTitle className="font-headline text-sm sm:text-base truncate">{product.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {product.createdAt ? 
                      formatTimeAgo(product.createdAt) :
                      t.justAdded
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-2 sm:p-3 pt-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm sm:text-md font-semibold">₹{product.price.toFixed(2)}</p>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>{t.editButton}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setProductToDelete(product)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>{t.deleteButton}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="flex flex-col items-center justify-center p-12 text-center">
            <CardTitle>{t.noProductsTitle}</CardTitle>
            <CardDescription className="mt-2 mb-6">
              {t.noProductsDescription}
            </CardDescription>
            <Button asChild>
              <Link href="/artisan/add-product">
                <PlusCircle className="mr-2 h-4 w-4" /> {t.addProductButton}
              </Link>
            </Button>
          </Card>
        )}
      </div>

      <Dialog open={adDialogOpen} onOpenChange={setAdDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your Advertisement</DialogTitle>
            <DialogDescription>
              Here is the AI-generated advertisement for your latest products.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {advertisement?.videoUrl ? (
              <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden">
                <video
                  src={advertisement.videoUrl}
                  className="w-full h-full object-cover"
                  controls
                  autoPlay
                  muted
                  loop
                >
                  <source src={advertisement.videoUrl} type="video/mp4" />
                   Your browser does not support the video tag.
                </video>
                 {advertisement.audioUrl && (
                    <audio src={advertisement.audioUrl} controls className="w-full mt-2" />
                )}
              </div>
            ) : (
              <div className="aspect-video w-full flex flex-col items-center justify-center bg-muted rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-sm text-muted-foreground">Generating your video... this may take a minute.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteDialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>
                {t.deleteDialogDescription.replace('{productName}', productToDelete?.name || '')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProductToDelete(null)}>{t.cancelButton}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct}>{t.deleteButton}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
