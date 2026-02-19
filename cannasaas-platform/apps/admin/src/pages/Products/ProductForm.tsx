/**
 * ═══════════════════════════════════════════════════════════════════
 * ProductForm.tsx — Create / Edit Product Form
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/admin/src/pages/Products/ProductForm.tsx
 *
 * Tabs:
 *  1. Basic Info     — name, slug, short/long description (+ AI generate)
 *  2. Cannabis Info  — strain type, THC/CBD, terpenes, effects, flavors
 *  3. Variants       — dynamic variant list (price, inventory, SKU)
 *  4. Media          — drag-and-drop image upload, primary selection, alt text
 *  5. SEO            — meta title, description, keywords (+ AI suggest)
 *  6. Compliance     — METRC ID, batch number, harvest/expiration dates
 *
 * API:
 *  POST /products                     (create)
 *  PUT  /products/:id                 (update)
 *  POST /products/:id/images          (image upload to S3)
 *  POST /ai/product-description       (AI description generation)
 */

import { useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Save, ArrowLeft, Sparkles, Plus, Trash2, Upload,
  X, GripVertical, Loader2, ImageIcon, Tag,
  Cannabis, DollarSign, FileText, Search, ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api/client';

// ─── Schema ───────────────────────────────────────────────────────────────────

const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name required'),
  sku: z.string().min(1, 'SKU required'),
  price: z.number().min(0),
  salePrice: z.number().min(0).optional().nullable(),
  costPrice: z.number().min(0).optional().nullable(),
  msrp: z.number().min(0).optional().nullable(),
  quantity: z.number().int().min(0),
  weight: z.number().optional().nullable(),
  weightUnit: z.enum(['g', 'oz', 'mg']).optional().nullable(),
  isActive: z.boolean().default(true),
});

const productSchema = z.object({
  // Basic
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, hyphens only'),
  shortDescription: z.string().max(160).optional(),
  description: z.string().optional(),
  brand: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  isActive: z.boolean().default(true),
  // Cannabis
  strainType: z.enum(['indica', 'sativa', 'hybrid', 'sativa_dominant_hybrid', 'indica_dominant_hybrid', 'cbd', '']).optional(),
  thcContent: z.number().min(0).max(100).optional().nullable(),
  cbdContent: z.number().min(0).max(100).optional().nullable(),
  terpenes: z.array(z.string()).default([]),
  effects: z.array(z.string()).default([]),
  flavors: z.array(z.string()).default([]),
  // Variants
  variants: z.array(variantSchema).min(1, 'At least one variant required'),
  // SEO
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
  keywords: z.array(z.string()).default([]),
  // Compliance
  metrcId: z.string().optional(),
  batchNumber: z.string().optional(),
  harvestDate: z.string().optional(),
  expirationDate: z.string().optional(),
  labTestResults: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

// ─── Constants ────────────────────────────────────────────────────────────────

const STRAIN_TYPES = [
  { value: '', label: 'Not applicable' },
  { value: 'indica', label: 'Indica' },
  { value: 'sativa', label: 'Sativa' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'sativa_dominant_hybrid', label: 'Sativa-Dominant Hybrid' },
  { value: 'indica_dominant_hybrid', label: 'Indica-Dominant Hybrid' },
  { value: 'cbd', label: 'CBD' },
];

const TERPENE_OPTIONS = [
  'Myrcene', 'Limonene', 'Caryophyllene', 'Linalool', 'Pinene',
  'Terpinolene', 'Ocimene', 'Humulene', 'Bisabolol', 'Valencene',
];

const EFFECT_OPTIONS = [
  'Relaxing', 'Uplifting', 'Euphoric', 'Creative', 'Energetic',
  'Focused', 'Sleepy', 'Happy', 'Talkative', 'Giggly',
];

const FLAVOR_OPTIONS = [
  'Earthy', 'Sweet', 'Citrus', 'Berry', 'Pine', 'Diesel',
  'Floral', 'Spicy', 'Herbal', 'Woody', 'Tropical', 'Vanilla',
];

const CATEGORIES = ['flower', 'pre-roll', 'vape', 'concentrate', 'edible', 'tincture', 'topical', 'accessory'];

// ─── Tag Input ────────────────────────────────────────────────────────────────

function TagInput({
  value, onChange, options, placeholder,
}: {
  value: string[]; onChange: (v: string[]) => void;
  options: string[]; placeholder: string;
}) {
  const [input, setInput] = useState('');

  const addTag = (tag: string) => {
    const clean = tag.trim();
    if (clean && !value.includes(clean)) onChange([...value, clean]);
    setInput('');
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-[2rem]">
        {value.map(tag => (
          <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-900/30 border border-amber-800/40 text-amber-300 text-xs rounded-full">
            {tag}
            <button type="button" onClick={() => onChange(value.filter(t => t !== tag))} className="hover:text-white">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      {/* Preset options */}
      <div className="flex flex-wrap gap-1">
        {options.filter(o => !value.includes(o)).map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => addTag(opt)}
            className="px-2 py-0.5 text-xs text-slate-400 border border-slate-700 rounded-full hover:border-amber-600/60 hover:text-amber-400 transition-colors"
          >
            + {opt}
          </button>
        ))}
      </div>
      {/* Custom input */}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={`Custom ${placeholder}…`}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(input); } }}
          className="h-8 text-sm bg-slate-900 border-slate-700 text-white placeholder:text-slate-600 focus:border-amber-500/50"
        />
        <Button type="button" size="sm" variant="outline" onClick={() => addTag(input)}
          className="h-8 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Image Upload Area ────────────────────────────────────────────────────────

interface ProductImage { id?: string; url: string; isPrimary: boolean; altText: string; file?: File; }

function ImageUploadPanel({
  images, onChange, productId,
}: {
  images: ProductImage[];
  onChange: (imgs: ProductImage[]) => void;
  productId?: string;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    const newImages: ProductImage[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const objectUrl = URL.createObjectURL(file);

      if (productId) {
        // Upload to real S3 endpoint
        const formData = new FormData();
        formData.append('image', file);
        try {
          const res = await apiClient.post(`/products/${productId}/images`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          newImages.push({ id: res.data.id, url: res.data.url, isPrimary: false, altText: '' });
        } catch {
          newImages.push({ url: objectUrl, isPrimary: false, altText: '', file });
        }
      } else {
        // Optimistic local preview (will upload on form submit)
        newImages.push({ url: objectUrl, isPrimary: false, altText: '', file });
      }
    }

    const combined = [...images, ...newImages];
    // Auto-set primary if none exists
    if (!combined.some(i => i.isPrimary) && combined.length > 0) combined[0].isPrimary = true;
    onChange(combined);
    setUploading(false);
  }, [images, onChange, productId]);

  const setPrimary = (idx: number) => {
    onChange(images.map((img, i) => ({ ...img, isPrimary: i === idx })));
  };

  const removeImage = (idx: number) => {
    const next = images.filter((_, i) => i !== idx);
    if (!next.some(i => i.isPrimary) && next.length > 0) next[0].isPrimary = true;
    onChange(next);
  };

  const updateAlt = (idx: number, altText: string) => {
    onChange(images.map((img, i) => i === idx ? { ...img, altText } : img));
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragging ? 'border-amber-500 bg-amber-900/10' : 'border-slate-700 hover:border-slate-600 bg-slate-900/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
            <p className="text-sm text-slate-400">Uploading…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-slate-500" />
            <p className="text-sm font-medium text-white">Drop images here or click to upload</p>
            <p className="text-xs text-slate-500">PNG, JPG, WebP — up to 10MB each</p>
          </div>
        )}
      </div>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((img, idx) => (
            <div key={idx} className={`relative group rounded-xl overflow-hidden border-2 transition-colors ${img.isPrimary ? 'border-amber-500' : 'border-slate-700 hover:border-slate-600'}`}>
              <img src={img.url} alt={img.altText || 'Product image'} className="w-full aspect-square object-cover" />
              {/* Overlay controls */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                    className="h-6 w-6 rounded-full bg-red-500/80 flex items-center justify-center hover:bg-red-400"
                  >
                    <X className="h-3 w-3 text-white" />
                  </button>
                </div>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setPrimary(idx); }}
                    className={`w-full py-1 text-xs rounded-md font-medium transition-colors ${
                      img.isPrimary
                        ? 'bg-amber-500 text-slate-950 cursor-default'
                        : 'bg-slate-700/80 text-white hover:bg-slate-600'
                    }`}
                  >
                    {img.isPrimary ? '★ Primary' : 'Set Primary'}
                  </button>
                </div>
              </div>
              {/* Alt text */}
              <div className="p-1.5 bg-slate-900 border-t border-slate-700">
                <input
                  type="text"
                  value={img.altText}
                  onChange={e => updateAlt(idx, e.target.value)}
                  onClick={e => e.stopPropagation()}
                  placeholder="Alt text…"
                  className="w-full text-xs bg-transparent text-slate-400 placeholder:text-slate-600 border-none outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id && id !== 'new';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [images, setImages] = useState<ProductImage[]>([]);
  const [aiLoadingDesc, setAiLoadingDesc] = useState(false);
  const [aiLoadingSeo, setAiLoadingSeo] = useState(false);

  // ── Load existing product ──
  const { isLoading: productLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => apiClient.get(`/products/${id}`).then(r => r.data),
    enabled: isEditing,
    onSuccess: (data: any) => {
      reset(data);
      setImages(data.images ?? []);
    },
  });

  // ── Form ──
  const {
    register, handleSubmit, control, watch, setValue, reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      isActive: true,
      variants: [{ name: '1/8 oz', sku: '', price: 0, quantity: 0, isActive: true }],
      terpenes: [], effects: [], flavors: [], keywords: [],
    },
  });

  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
    control, name: 'variants',
  });

  // Auto-generate slug from name
  const watchName = watch('name');
  const generateSlug = () => {
    const slug = watchName?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') ?? '';
    setValue('slug', slug);
  };

  // ── AI Description ──
  const generateDescription = async () => {
    setAiLoadingDesc(true);
    try {
      const res = await apiClient.post('/ai/product-description', {
        name: watch('name'),
        category: watch('category'),
        strainType: watch('strainType'),
        thcContent: watch('thcContent'),
        effects: watch('effects'),
        flavors: watch('flavors'),
      });
      setValue('description', res.data.description);
      setValue('shortDescription', res.data.shortDescription);
    } catch {
      toast({ title: 'AI generation failed', variant: 'destructive' });
    }
    setAiLoadingDesc(false);
  };

  // ── AI SEO ──
  const generateSeo = async () => {
    setAiLoadingSeo(true);
    try {
      const res = await apiClient.post('/ai/product-description', {
        name: watch('name'),
        category: watch('category'),
        description: watch('description'),
        generateSeo: true,
      });
      setValue('metaTitle', res.data.metaTitle);
      setValue('metaDescription', res.data.metaDescription);
      setValue('keywords', res.data.keywords ?? []);
    } catch {
      toast({ title: 'AI generation failed', variant: 'destructive' });
    }
    setAiLoadingSeo(false);
  };

  // ── Submit ──
  const saveMutation = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      const payload = { ...values, images };
      if (isEditing) return apiClient.put(`/products/${id}`, payload);
      return apiClient.post('/products', payload);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: isEditing ? 'Product updated' : 'Product created' });
      navigate(`/products/${res.data.id}/edit`);
    },
    onError: () => {
      toast({ title: 'Save failed', variant: 'destructive' });
    },
  });

  if (isEditing && productLoading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <Skeleton className="h-10 w-48 mb-8 bg-slate-800" />
        <Skeleton className="h-[600px] bg-slate-800 rounded-xl" />
      </div>
    );
  }

  const fieldClass = "bg-slate-900 border-slate-700 text-white placeholder:text-slate-600 focus:border-amber-500/60 focus-visible:ring-0 focus-visible:ring-offset-0";
  const labelClass = "text-sm font-medium text-slate-300";

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 lg:p-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/products')}
            className="text-slate-400 hover:text-white hover:bg-slate-800 gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Products
          </Button>
          <div>
            <h1 className="text-xl font-bold text-white">
              {isEditing ? 'Edit Product' : 'New Product'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <div className="flex items-center gap-2">
                <Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-amber-500" />
                <span className="text-sm text-slate-400">{field.value ? 'Active' : 'Inactive'}</span>
              </div>
            )}
          />
          <Button
            onClick={handleSubmit(data => saveMutation.mutate(data))}
            disabled={isSubmitting || saveMutation.isPending}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold gap-2"
          >
            {(isSubmitting || saveMutation.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Product
          </Button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="bg-slate-900 border border-slate-800 p-1 gap-1 flex-wrap h-auto">
          {[
            { value: 'basic', label: 'Basic Info', icon: FileText },
            { value: 'cannabis', label: 'Cannabis Info', icon: Cannabis },
            { value: 'variants', label: 'Variants', icon: Tag },
            { value: 'media', label: 'Media', icon: ImageIcon },
            { value: 'seo', label: 'SEO', icon: Search },
            { value: 'compliance', label: 'Compliance', icon: ShieldCheck },
          ].map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 data-[state=active]:font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 text-sm"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Tab: Basic Info ── */}
        <TabsContent value="basic">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className={labelClass}>Product Name *</Label>
                  <Input {...register('name')} placeholder="e.g. Blue Dream" className={fieldClass}
                    onBlur={generateSlug} />
                  {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className={labelClass}>Slug *</Label>
                    <button type="button" onClick={generateSlug} className="text-xs text-amber-400 hover:text-amber-300">
                      Auto-generate
                    </button>
                  </div>
                  <Input {...register('slug')} placeholder="blue-dream" className={fieldClass} />
                  {errors.slug && <p className="text-xs text-red-400">{errors.slug.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className={labelClass}>Brand</Label>
                  <Input {...register('brand')} placeholder="e.g. Premium Farms" className={fieldClass} />
                </div>
                <div className="space-y-1.5">
                  <Label className={labelClass}>Category *</Label>
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className={`${fieldClass} h-9`}>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-700">
                          {CATEGORIES.map(c => (
                            <SelectItem key={c} value={c} className="text-white capitalize focus:bg-slate-800">{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.category && <p className="text-xs text-red-400">{errors.category.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className={labelClass}>Short Description <span className="text-slate-500 font-normal">(max 160 chars)</span></Label>
                <Input {...register('shortDescription')} placeholder="Brief one-line summary for cards" className={fieldClass} />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className={labelClass}>Full Description</Label>
                  <Button type="button" variant="outline" size="sm" onClick={generateDescription}
                    disabled={aiLoadingDesc}
                    className="h-7 text-xs gap-1.5 border-amber-600/40 text-amber-400 hover:bg-amber-900/20 hover:border-amber-500">
                    {aiLoadingDesc ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    AI Generate
                  </Button>
                </div>
                <Textarea
                  {...register('description')}
                  placeholder="Full product description…"
                  rows={6}
                  className={`${fieldClass} resize-y`}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Cannabis Info ── */}
        <TabsContent value="cannabis">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <Label className={labelClass}>Strain Type</Label>
                  <Controller
                    name="strainType"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value ?? ''} onValueChange={field.onChange}>
                        <SelectTrigger className={`${fieldClass} h-9`}>
                          <SelectValue placeholder="Select strain" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-700">
                          {STRAIN_TYPES.map(s => (
                            <SelectItem key={s.value} value={s.value} className="text-white focus:bg-slate-800">
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className={labelClass}>THC Content (%)</Label>
                  <Input
                    type="number" step="0.1" min="0" max="100"
                    {...register('thcContent', { valueAsNumber: true })}
                    placeholder="e.g. 24.5"
                    className={fieldClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className={labelClass}>CBD Content (%)</Label>
                  <Input
                    type="number" step="0.1" min="0" max="100"
                    {...register('cbdContent', { valueAsNumber: true })}
                    placeholder="e.g. 0.8"
                    className={fieldClass}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className={labelClass}>Terpenes</Label>
                <Controller
                  name="terpenes"
                  control={control}
                  render={({ field }) => (
                    <TagInput value={field.value} onChange={field.onChange} options={TERPENE_OPTIONS} placeholder="terpene" />
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label className={labelClass}>Effects</Label>
                <Controller
                  name="effects"
                  control={control}
                  render={({ field }) => (
                    <TagInput value={field.value} onChange={field.onChange} options={EFFECT_OPTIONS} placeholder="effect" />
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label className={labelClass}>Flavors</Label>
                <Controller
                  name="flavors"
                  control={control}
                  render={({ field }) => (
                    <TagInput value={field.value} onChange={field.onChange} options={FLAVOR_OPTIONS} placeholder="flavor" />
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Variants ── */}
        <TabsContent value="variants">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="space-y-4">
                {variantFields.map((field, index) => (
                  <div key={field.id} className="p-4 rounded-xl border border-slate-700 bg-slate-950 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-400">
                        <GripVertical className="h-4 w-4" />
                        <span className="text-sm font-medium text-white">Variant {index + 1}</span>
                      </div>
                      {variantFields.length > 1 && (
                        <button type="button" onClick={() => removeVariant(index)}
                          className="text-slate-500 hover:text-red-400 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs text-slate-400">Name *</Label>
                        <Input {...register(`variants.${index}.name`)} placeholder="1/8 oz" className={`${fieldClass} h-8 text-sm`} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-400">SKU *</Label>
                        <Input {...register(`variants.${index}.sku`)} placeholder="BD-125" className={`${fieldClass} h-8 text-sm`} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-400">Base Price ($) *</Label>
                        <Input type="number" step="0.01" {...register(`variants.${index}.price`, { valueAsNumber: true })}
                          placeholder="45.00" className={`${fieldClass} h-8 text-sm`} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-400">Sale Price ($)</Label>
                        <Input type="number" step="0.01" {...register(`variants.${index}.salePrice`, { valueAsNumber: true })}
                          placeholder="—" className={`${fieldClass} h-8 text-sm`} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-400">Stock Qty *</Label>
                        <Input type="number" {...register(`variants.${index}.quantity`, { valueAsNumber: true })}
                          placeholder="0" className={`${fieldClass} h-8 text-sm`} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-400">Cost Price ($)</Label>
                        <Input type="number" step="0.01" {...register(`variants.${index}.costPrice`, { valueAsNumber: true })}
                          placeholder="—" className={`${fieldClass} h-8 text-sm`} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-400">MSRP ($)</Label>
                        <Input type="number" step="0.01" {...register(`variants.${index}.msrp`, { valueAsNumber: true })}
                          placeholder="—" className={`${fieldClass} h-8 text-sm`} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-400">Weight</Label>
                        <Input type="number" step="0.1" {...register(`variants.${index}.weight`, { valueAsNumber: true })}
                          placeholder="3.5" className={`${fieldClass} h-8 text-sm`} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-400">Unit</Label>
                        <Controller
                          name={`variants.${index}.weightUnit`}
                          control={control}
                          render={({ field }) => (
                            <Select value={field.value ?? ''} onValueChange={field.onChange}>
                              <SelectTrigger className={`${fieldClass} h-8 text-sm`}>
                                <SelectValue placeholder="g" />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-900 border-slate-700">
                                <SelectItem value="g" className="text-white focus:bg-slate-800">g</SelectItem>
                                <SelectItem value="oz" className="text-white focus:bg-slate-800">oz</SelectItem>
                                <SelectItem value="mg" className="text-white focus:bg-slate-800">mg</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button type="button" variant="outline" onClick={() => appendVariant({ name: '', sku: '', price: 0, quantity: 0, isActive: true })}
                className="mt-4 border-dashed border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 gap-2">
                <Plus className="h-4 w-4" /> Add Variant
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Media ── */}
        <TabsContent value="media">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <p className="text-sm text-slate-400 mb-4">
                Upload product photos. Click <strong className="text-white">Set Primary</strong> on the image to feature first in listings.
              </p>
              <ImageUploadPanel images={images} onChange={setImages} productId={isEditing ? id : undefined} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: SEO ── */}
        <TabsContent value="seo">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-400">Optimize how this product appears in search engines.</p>
                <Button type="button" variant="outline" size="sm" onClick={generateSeo}
                  disabled={aiLoadingSeo}
                  className="h-7 text-xs gap-1.5 border-amber-600/40 text-amber-400 hover:bg-amber-900/20">
                  {aiLoadingSeo ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  AI Suggest
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label className={labelClass}>Meta Title <span className="text-slate-500 font-normal">(max 70 chars)</span></Label>
                <Input {...register('metaTitle')} placeholder="Buy Blue Dream Cannabis | YourDispensary" className={fieldClass} />
                <p className="text-xs text-slate-500">{watch('metaTitle')?.length ?? 0} / 70</p>
              </div>

              <div className="space-y-1.5">
                <Label className={labelClass}>Meta Description <span className="text-slate-500 font-normal">(max 160 chars)</span></Label>
                <Textarea
                  {...register('metaDescription')}
                  placeholder="Premium Blue Dream sativa-dominant hybrid with 24% THC. Available for pickup and delivery."
                  rows={3}
                  className={`${fieldClass} resize-none`}
                />
                <p className="text-xs text-slate-500">{watch('metaDescription')?.length ?? 0} / 160</p>
              </div>

              <div className="space-y-1.5">
                <Label className={labelClass}>Keywords</Label>
                <Controller
                  name="keywords"
                  control={control}
                  render={({ field }) => (
                    <TagInput value={field.value} onChange={field.onChange} options={[]} placeholder="keyword" />
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Compliance ── */}
        <TabsContent value="compliance">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-start gap-3 p-4 bg-amber-900/10 border border-amber-800/30 rounded-lg">
                <ShieldCheck className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-200/80">
                  Compliance data is required for Metrc seed-to-sale reporting in NY, NJ, and CT.
                  METRC IDs sync automatically when connected via the Compliance module.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className={labelClass}>METRC Package ID / Tag</Label>
                  <Input {...register('metrcId')} placeholder="1A406030000A7C9000001657" className={fieldClass} />
                </div>
                <div className="space-y-1.5">
                  <Label className={labelClass}>Batch Number</Label>
                  <Input {...register('batchNumber')} placeholder="BATCH-2025-0042" className={fieldClass} />
                </div>
                <div className="space-y-1.5">
                  <Label className={labelClass}>Harvest Date</Label>
                  <Input type="date" {...register('harvestDate')} className={fieldClass} />
                </div>
                <div className="space-y-1.5">
                  <Label className={labelClass}>Expiration Date</Label>
                  <Input type="date" {...register('expirationDate')} className={fieldClass} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className={labelClass}>Lab Test Results URL / COA</Label>
                <Input {...register('labTestResults')} placeholder="https://lab.example.com/coa/batch-0042.pdf" className={fieldClass} />
                <p className="text-xs text-slate-500">Certificate of Analysis URL from testing lab</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Sticky Save Footer ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 border-t border-slate-800 backdrop-blur px-6 py-3 flex items-center justify-end gap-3 z-10">
        <Button variant="ghost" onClick={() => navigate('/products')} className="text-slate-400 hover:text-white">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit(data => saveMutation.mutate(data))}
          disabled={isSubmitting || saveMutation.isPending}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold gap-2"
        >
          {(isSubmitting || saveMutation.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isEditing ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </div>
  );
}
