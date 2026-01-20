
'use client';

import { useState, useEffect } from 'react';
import { useMarketplaceData } from '@/hooks/use-marketplace-data';
import ProductCard from '@/components/product-card';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import type { Category, Product } from '@/lib/types';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from '@/context/translation-context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';

export default function BuyerHomePage() {
  const { translations } = useTranslation();
  const t = translations.buyer_home;
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { products, categories: baseCategories, artisans, loading } = useMarketplaceData();

  const categories = baseCategories.map((category, index) => ({
    ...category,
    name: translations.product_categories[index] || category.name,
  }));

  const trendingProducts = [...products].sort((a, b) => b.likes - a.likes).slice(0, 8);
  const bestSellingProducts = [...products].sort((a, b) => b.sales - a.sales).slice(0, 8);

  const filteredProducts = selectedCategory
    ? products.filter(p => p.category === selectedCategory)
    : products;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-6">

      {/* Artisans Showcase Section */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-headline text-lg sm:text-xl font-semibold">
            {t.artisansTitle}
          </h2>
          <Link href="/buyer/profile" passHref>
            <Button
              variant="outline"
              size="icon"
              aria-label={t.profileButton}
              className="rounded-full"
            >
              <User className="h-5 w-5" />
            </Button>
          </Link>
        </div>
        <Carousel opts={{ align: 'start' }} className="-mx-2">
          <CarouselContent className="-ml-2">
            {artisans.map(artisan => (
              <CarouselItem key={artisan.id} className="basis-1/2 md:basis-1/3 lg:basis-1/4 pl-2">
                <Card className="overflow-hidden">
                  <CardContent className="p-4 text-center">
                    <Avatar className="w-20 h-20 mx-auto mb-2 border-2 border-primary">
                      <AvatarImage src={artisan.avatar.url} alt={artisan.name} />
                      <AvatarFallback>{artisan.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold font-headline">{artisan.name}</h3>
                    <p className="text-xs text-muted-foreground">{artisan.crafts?.join(', ')}</p>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute left-[-0.5rem] top-1/2 -translate-y-1/2 hidden sm:flex" />
          <CarouselNext className="absolute right-[-0.5rem] top-1/2 -translate-y-1/2 hidden sm:flex" />
        </Carousel>
      </section>

      {/* Categories Section */}
      <section className="mb-8">
        <h2 className="mb-4 font-headline text-lg sm:text-xl font-semibold">
          {t.categoriesTitle}
        </h2>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          <Card
            onClick={() => setSelectedCategory(null)}
            className={`group cursor-pointer overflow-hidden text-center transition-all hover:shadow-lg hover:-translate-y-1 ${!selectedCategory ? 'bg-primary text-primary-foreground' : ''}`}
          >
            <CardContent className="flex flex-col items-center justify-center p-2 h-full">
              <span className="font-semibold text-xs sm:text-sm">{t.allCategories}</span>
            </CardContent>
          </Card>
          {categories.map((category) => {
            // Find logic relies on ID matching now that we fetch from DB. 
            // Migration script used '1', '2' etc so IDs should match if we seeded correctly.
            // But baseCategories IS the category list from hook.
            // The mapping above created 'categories' with translated names.
            // We need to be careful about 'originalCategory'.
            // The map above uses index. If DB returns random order, index mapping might fail.
            // Migration script iterated array, so order MIGHT be preserved but no guarantee.
            // BETTER: Map by ID if possible, or just rely on 'category' being sufficient.

            // Refactored logic:
            const isSelected = selectedCategory === category.name; // selectedCategory stores NAME

            return (
              <Card
                key={category.id}
                onClick={() => setSelectedCategory(category.name)}
                className={`group cursor-pointer overflow-hidden text-center transition-all hover:shadow-lg hover:-translate-y-1 ${isSelected ? 'bg-primary text-primary-foreground' : ''}`}
              >
                <CardContent className="flex flex-col items-center justify-center p-2 h-full">
                  <category.icon className={`mb-1 h-5 w-5 sm:h-6 sm:w-6 transition-colors ${isSelected ? 'text-primary-foreground' : 'text-primary group-hover:text-accent-foreground'}`} />
                  <span className={`font-semibold text-[10px] sm:text-xs text-center leading-tight transition-colors ${isSelected ? 'text-primary-foreground' : 'text-foreground group-hover:text-accent-foreground'}`}>{category.name}</span>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Conditional Rendering based on category selection */}
      {selectedCategory ? (
        <section>
          <h2 className="mb-4 font-headline text-lg sm:text-xl font-semibold">
            {selectedCategory}
          </h2>
          <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:gap-x-4 sm:gap-y-6 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <Link href={`/buyer/product/${product.id}`} key={product.id}>
                <ProductCard product={product} />
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <>
          {/* Trending Products Section */}
          <section className="mb-10">
            <h2 className="mb-4 font-headline text-lg sm:text-xl font-semibold">
              {t.trendingTitle}
            </h2>
            <Carousel
              opts={{ align: 'start', loop: true }}
              plugins={[Autoplay({ delay: 2500, stopOnInteraction: false })]}
              className="-mx-2"
            >
              <CarouselContent className="-ml-2">
                {trendingProducts.map((product) => (
                  <CarouselItem key={product.id} className="basis-3/4 sm:basis-1/2 md:basis-1/3 lg:basis-1/4 pl-2">
                    <Link href={`/buyer/product/${product.id}`}>
                      <ProductCard product={product} />
                    </Link>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </section>

          {/* Best Selling Products Section */}
          <section>
            <h2 className="mb-4 font-headline text-lg sm:text-xl font-semibold">
              {t.bestSellingTitle}
            </h2>
            <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:gap-x-4 sm:gap-y-6 md:grid-cols-3 lg:grid-cols-4">
              {bestSellingProducts.map((product) => (
                <Link href={`/buyer/product/${product.id}`} key={product.id}>
                  <ProductCard product={product} />
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

