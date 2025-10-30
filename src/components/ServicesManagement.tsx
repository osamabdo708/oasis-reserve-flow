import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Service {
  id: string;
  name: string;
  description: string | null;
  image_url: string;
  price: number;
  currency: string;
  is_active: boolean;
  display_order: number | null;
}

export const ServicesManagement = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image_url: "",
    price: "",
    currency: "₪",
    is_active: true,
    display_order: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (error: any) {
      console.error("Error fetching services:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الخدمات",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsUploading(true);
      let finalImageUrl = formData.image_url;

      // Upload image if file is selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('service-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('service-images')
          .getPublicUrl(fileName);

        finalImageUrl = publicUrl;
      }

      const serviceData = {
        name: formData.name,
        description: formData.description || null,
        image_url: finalImageUrl,
        price: parseFloat(formData.price),
        currency: formData.currency,
        is_active: formData.is_active,
        display_order: formData.display_order ? parseInt(formData.display_order) : null,
      };

      if (editingService) {
        const { error } = await supabase
          .from("services")
          .update(serviceData)
          .eq("id", editingService.id);

        if (error) throw error;
        
        toast({
          title: "تم التحديث",
          description: "تم تحديث الخدمة بنجاح",
        });
      } else {
        const { error } = await supabase
          .from("services")
          .insert([serviceData]);

        if (error) throw error;
        
        toast({
          title: "تمت الإضافة",
          description: "تمت إضافة الخدمة بنجاح",
        });
      }

      resetForm();
      setIsDialogOpen(false);
      fetchServices();
    } catch (error: any) {
      console.error("Error saving service:", error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في حفظ الخدمة",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || "",
      image_url: service.image_url,
      price: service.price.toString(),
      currency: service.currency,
      is_active: service.is_active,
      display_order: service.display_order?.toString() || "",
    });
    setImagePreview(service.image_url);
    setIsDialogOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast({
        title: "تم الحذف",
        description: "تم حذف الخدمة بنجاح",
      });
      
      fetchServices();
    } catch (error: any) {
      console.error("Error deleting service:", error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في حذف الخدمة",
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (service: Service) => {
    try {
      const { error } = await supabase
        .from("services")
        .update({ is_active: !service.is_active })
        .eq("id", service.id);

      if (error) throw error;
      
      toast({
        title: "تم التحديث",
        description: service.is_active ? "تم إخفاء الخدمة" : "تم تفعيل الخدمة",
      });
      
      fetchServices();
    } catch (error: any) {
      console.error("Error toggling service:", error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث حالة الخدمة",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      image_url: "",
      price: "",
      currency: "₪",
      is_active: true,
      display_order: "",
    });
    setEditingService(null);
    setImageFile(null);
    setImagePreview("");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>إدارة الخدمات</CardTitle>
            <CardDescription>
              إجمالي الخدمات: {services.length}
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                إضافة خدمة
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingService ? "تعديل الخدمة" : "إضافة خدمة جديدة"}
                  </DialogTitle>
                  <DialogDescription>
                    أدخل تفاصيل الخدمة
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">اسم الخدمة *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">الوصف</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="image">صورة الخدمة *</Label>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    {imagePreview && (
                      <div className="mt-2">
                        <img 
                          src={imagePreview} 
                          alt="معاينة" 
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      أو أدخل رابط الصورة يدوياً:
                    </p>
                    <Input
                      id="image_url"
                      placeholder="https://example.com/image.jpg"
                      value={formData.image_url}
                      onChange={(e) => {
                        setFormData({ ...formData, image_url: e.target.value });
                        setImagePreview(e.target.value);
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="price">السعر *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="currency">العملة</Label>
                      <Input
                        id="currency"
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="display_order">ترتيب العرض</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isUploading}>
                    {isUploading ? "جاري الرفع..." : editingService ? "حفظ التعديلات" : "إضافة"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center py-8 text-muted-foreground">جاري التحميل...</p>
        ) : services.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">لا توجد خدمات</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الصورة</TableHead>
                  <TableHead className="text-right">الترتيب</TableHead>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">الوصف</TableHead>
                  <TableHead className="text-right">السعر</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="text-right">
                      <img 
                        src={service.image_url} 
                        alt={service.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    </TableCell>
                    <TableCell className="text-right">{service.display_order || "-"}</TableCell>
                    <TableCell className="text-right font-medium">{service.name}</TableCell>
                    <TableCell className="text-right max-w-xs truncate">
                      {service.description || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {service.price} {service.currency}
                    </TableCell>
                    <TableCell className="text-right">
                      {service.is_active ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          نشط
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                          مخفي
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleActive(service)}
                          className="gap-2"
                        >
                          {service.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(service)}
                          className="gap-2"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive" className="gap-2">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>حذف الخدمة</AlertDialogTitle>
                              <AlertDialogDescription>
                                هل أنت متأكد من حذف هذه الخدمة؟ لا يمكن التراجع عن هذا الإجراء.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(service.id)}>
                                نعم، احذف
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
