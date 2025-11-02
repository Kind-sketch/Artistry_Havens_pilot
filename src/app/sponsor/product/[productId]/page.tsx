
'use client';

import { useParams, useRouter } from 'next/navigation';
import { products } from '@/lib/data';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, Loader2 } from 'lucide-react';
import Reviews from '@/components/reviews';
import { useTranslation } from '@/context/translation-context';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { SponsorRequest } from '@/lib/types';


const sponsorSchema = z.object({
  monthlyContribution: z.coerce.number().min(1, 'Contribution must be at least 1.'),
  sharePercentage: z.coerce.number().min(1, 'Share must be at least 1%').max(100, 'Share cannot exceed 100%'),
  message: z.string().min(10, 'Message must be at least 10 characters.'),
});

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { translations } = useTranslation();
  const t = translations.sponsor_product_page;
  const productId = params.productId as string;
  const product = products.find(p => p.id === productId);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof sponsorSchema>>({
    resolver: zodResolver(sponsorSchema),
    defaultValues: {
      monthlyContribution: 50,
      sharePercentage: 10,
      message: '',
    },
  });

  if (!product) {
    return <div className="p-4 text-center">{t.productNotFound}</div>;
  }
  
  const onSubmit = (values: z.infer<typeof sponsorSchema>) => {
    setIsSubmitting(true);
    // In a real app, this would be the logged-in sponsor's data
    const sponsorData = {
        id: `sponsor-${Date.now()}`,
        name: 'Generous Sponsor',
        avatarUrl: 'https://picsum.photos/seed/sponsor-new/100/100',
    };

    const newRequest: SponsorRequest = {
        ...sponsorData,
        monthlyContribution: values.monthlyContribution,
        sharePercentage: values.sharePercentage,
        message: values.message
    }
    
    // Simulate adding the request to what the artisan sees
    const currentRequests: SponsorRequest[] = JSON.parse(localStorage.getItem('sponsorRequests') || '[]');
    localStorage.setItem('sponsorRequests', JSON.stringify([newRequest, ...currentRequests]));

    setTimeout(() => {
        setIsSubmitting(false);
        setIsDialogOpen(false);
        toast({
          title: t.toastTitle,
          description: t.toastDescription.replace('{artisanName}', product.artisan.name),
        });
        form.reset();
    }, 1000);
  }


  return (
    <div className="p-4">
       <Button onClick={() => router.back()} variant="ghost" className="mb-4">
        <ChevronLeft className="mr-2 h-4 w-4" />
        {t.backButton}
      </Button>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative aspect-square w-full">
            <Image
              src={product.image.url}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
        </CardContent>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="font-headline text-2xl md:text-3xl">{product.name}</CardTitle>
            <p className="font-semibold text-xl md:text-2xl pt-2">₹{product.price.toFixed(2)}</p>
          </div>
           {product.reviews && <Reviews rating={product.reviews.rating} count={product.reviews.count} />}
        </CardHeader>
        <CardContent>
            <Separator className="my-4" />
             <div>
                <h3 className="font-headline text-lg font-semibold mb-2">{t.artisanDetails}</h3>
                <p className="text-muted-foreground">{t.name}: {product.artisan.name}</p>
                {product.artisan.phone && <p className="text-muted-foreground">{t.phone}: {product.artisan.phone}</p>}
            </div>
            <Separator className="my-4" />
            <div>
                <h3 className="font-headline text-lg font-semibold mb-2">{t.description}</h3>
                <p className="text-muted-foreground">{product.description}</p>
            </div>
            {product.story && (
                <>
                    <Separator className="my-4" />
                    <div>
                        <h3 className="font-headline text-lg font-semibold mb-2">{t.story}</h3>
                        <p className="text-muted-foreground italic">"{product.story}"</p>
                    </div>
                </>
            )}
        </CardContent>
        <CardContent>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">{t.sponsorButton}</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Sponsor {product.artisan.name}</DialogTitle>
                  <DialogDescription>
                    Make an offer to support this artisan's work and share in their success.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="monthlyContribution"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Monthly Contribution (₹)</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="sharePercentage"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Requested Revenue Share (%)</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Message to Artisan</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Tell the artisan why you want to sponsor them..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Sponsorship Request
                        </Button>
                    </form>
                </Form>
              </DialogContent>
            </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
