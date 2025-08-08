import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Image as ImageIcon, Shield } from "lucide-react";

// Fix Leaflet default markers
// @ts-ignore
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const siteSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  local_name: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  category_id: z.string({ required_error: "Pilih kategori" }),
  latitude: z.coerce.number({ required_error: "Pilih titik di peta" }),
  longitude: z.coerce.number({ required_error: "Pilih titik di peta" }),
  visiting_hours: z.string().optional().or(z.literal("")),
  entrance_fee: z.coerce.number().min(0).default(0),
  village: z.string().optional().or(z.literal("")),
  district: z.string().optional().or(z.literal("")),
  established_year: z.coerce.number().int().optional().or(z.nan()).transform(v => Number.isNaN(v) ? undefined : v),
});

type SiteFormValues = z.infer<typeof siteSchema>;

interface Category {
  id: string;
  name: string;
  color_hex: string | null;
}

const Admin: React.FC = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [createdSiteId, setCreatedSiteId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  // Map refs
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);

  const form = useForm<SiteFormValues>({
    resolver: zodResolver(siteSchema),
    defaultValues: {
      name: "",
      local_name: "",
      description: "",
      category_id: "",
      latitude: -8.65,
      longitude: 116.3241,
      visiting_hours: "",
      entrance_fee: 0,
      village: "",
      district: "",
      established_year: undefined,
    },
  });

  useEffect(() => {
    document.title = "Admin Warisan Budaya | GIS Sasak";
  }, []);

  // Load auth state and categories
  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      setUserId(auth.user?.id ?? null);

      const { data, error } = await supabase
        .from("heritage_categories")
        .select("id,name,color_hex")
        .order("name");
      if (error) {
        console.error(error);
        toast({ title: "Gagal", description: "Gagal memuat kategori", variant: "destructive" });
      } else {
        setCategories(data || []);
      }
    })();
  }, [toast]);

  // Init map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    map.current = L.map(mapContainer.current, {
      center: [-8.65, 116.3241],
      zoom: 10,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map.current);

    const initial = L.marker([form.getValues("latitude"), form.getValues("longitude")]).addTo(map.current);
    marker.current = initial;

    map.current.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      if (marker.current) marker.current.setLatLng([lat, lng]);
      else marker.current = L.marker([lat, lng]).addTo(map.current!);
      form.setValue("latitude", lat, { shouldValidate: true });
      form.setValue("longitude", lng, { shouldValidate: true });
    });
  }, [form]);

  const onSubmit = async (values: SiteFormValues) => {
    try {
      const payload: any = {
        name: values.name,
        local_name: values.local_name || null,
        description: values.description || null,
        category_id: values.category_id,
        latitude: values.latitude,
        longitude: values.longitude,
        visiting_hours: values.visiting_hours || null,
        entrance_fee: values.entrance_fee ?? 0,
        village: values.village || null,
        district: values.district || null,
        established_year: values.established_year,
      };

      const { data, error } = await supabase.from("cultural_sites").insert(payload).select("id").single();
      if (error) throw error;

      setCreatedSiteId(data?.id || null);
      toast({ title: "Berhasil", description: "Situs budaya berhasil disimpan" });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Gagal menyimpan",
        description: err?.message || "Pastikan Anda sudah login (RLS mengharuskan pengguna terautentik)",
        variant: "destructive",
      });
    }
  };

  const handleAnalyze = async () => {
    if (!createdSiteId || !selectedImage) {
      toast({ title: "Lengkapi data", description: "Simpan situs dan pilih gambar terlebih dahulu" });
      return;
    }

    // Placeholder until Edge Function is configured
    toast({
      title: "Butuh Token Hugging Face",
      description: "Masukkan HUGGING_FACE_ACCESS_TOKEN agar analisis CNN bisa dijalankan.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-cultural">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Input Warisan Budaya</h1>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>Hanya pengguna terautentik yang dapat menyimpan</span>
          </div>
        </div>

        {!userId && (
          <Alert>
            <AlertTitle>Diperlukan Login</AlertTitle>
            <AlertDescription>
              Anda belum login. Kebijakan keamanan (RLS) mengharuskan pengguna terautentik untuk membuat data.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <Card className="p-6 lg:col-span-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Situs</FormLabel>
                        <FormControl>
                          <Input placeholder="Contoh: Desa Adat Sade" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="local_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Lokal</FormLabel>
                        <FormControl>
                          <Input placeholder="Sasak name (opsional)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kategori</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih kategori" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="latitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Latitude</FormLabel>
                          <FormControl>
                            <Input type="number" step="any" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="longitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Longitude</FormLabel>
                          <FormControl>
                            <Input type="number" step="any" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deskripsi</FormLabel>
                      <FormControl>
                        <Textarea rows={4} placeholder="Sejarah singkat, nilai budaya, dll" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="visiting_hours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jam Kunjungan</FormLabel>
                        <FormControl>
                          <Input placeholder="08.00 - 17.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="entrance_fee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Biaya Masuk (Rp)</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="established_year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tahun Berdiri</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="mis. 1800" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="village"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Desa</FormLabel>
                        <FormControl>
                          <Input placeholder="Nama desa" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kecamatan</FormLabel>
                        <FormControl>
                          <Input placeholder="Nama kecamatan" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit">Simpan Situs</Button>
                </div>
              </form>
            </Form>
          </Card>

          {/* Map & CNN Section */}
          <div className="space-y-6">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-heritage" />
                <h3 className="font-semibold">Pilih Titik Koordinat</h3>
              </div>
              <div ref={mapContainer} className="h-64 w-full rounded-md overflow-hidden shadow-cultural" />
              <p className="text-xs text-muted-foreground mt-2">Klik pada peta untuk menentukan lokasi.</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <ImageIcon className="w-4 h-4 text-accent" />
                <h3 className="font-semibold">Analisis CNN (Gambar)</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="image">Unggah Gambar Situs</Label>
                  <Input id="image" type="file" accept="image/*" onChange={(e) => setSelectedImage(e.target.files?.[0] || null)} />
                </div>
                <Button variant="secondary" onClick={handleAnalyze} disabled={!createdSiteId || !selectedImage}>
                  Jalankan Analisis CNN
                </Button>
                {!createdSiteId && (
                  <p className="text-xs text-muted-foreground">Simpan situs terlebih dahulu untuk mengaktifkan analisis.</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
