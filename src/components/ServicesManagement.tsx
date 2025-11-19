import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Eye, EyeOff, Upload, X } from "lucide-react";
import massageImg from "@/assets/massage.jpg";
import hammamImg from "@/assets/hammam.jpg";
import skincareImg from "@/assets/skincare.jpg";
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

interface DurationOption {
  value: string;
  label: string;
  price: number;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  image_url: string;
  price: number;
  currency: string;
  is_active: boolean;
  display_order: number | null;
  duration_options?: DurationOption[];
}

export const ServicesManagement = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image_url: "",
    price: "",
    currency: "₪",
    is_active: true,
    display_order: "",
    duration_options: [
      { value: "30 mins", label: "30 دقيقة", price: 100 },
      { value: "1 hr", label: "ساعة", price: 150 },
      { value: "1.5 hr", label: "ساعة ونصف", price: 200 },
    ] as DurationOption[],
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const getServiceImage = (imageUrl: string, serviceName: string) => {
    // If the image_url starts with http/https, use it directly (uploaded images)
    if (imageUrl?.startsWith('http')) {
      return imageUrl;
    }
    
    // Otherwise, use the imported local images based on service name
    if (serviceName.includes('مساج')) return massageImg;
    if (serviceName.includes('حمام')) return hammamImg;
    if (serviceName.includes('عناية')) return skincareImg;
    
    // Default fallback
    return massageImg;
  };

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setServices((data || []).map(service => ({
        ...service,
        duration_options: service.duration_options as unknown as DurationOption[] || [
          { value: "30 mins", label: "30 دقيقة", price: 100 },
          { value: "1 hr", label: "ساعة", price: 150 },
          { value: "1.5 hr", label: "ساعة ونصف", price: 200 },
        ]
      })));
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار ملف صورة",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "خطأ",
        description: "حجم الملف يجب أن يكون أقل من 5 ميجابايت",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("service-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("service-images")
        .getPublicUrl(fileName);

      setFormData({ ...formData, image_url: data.publicUrl });
      
      toast({
        title: "تم الرفع",
        description: "تم رفع الصورة بنجاح",
      });
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في رفع الصورة",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const serviceData = {
        name: formData.name,
        description: formData.description || null,
        image_url: formData.image_url,
        price: parseFloat(formData.price),
        currency: formData.currency,
        is_active: formData.is_active,
        display_order: formData.display_order ? parseInt(formData.display_order) : null,
        duration_options: JSON.parse(JSON.stringify(formData.duration_options)),
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
      duration_options: service.duration_options || [
        { value: "30 mins", label: "30 دقيقة", price: 100 },
        { value: "1 hr", label: "ساعة", price: 150 },
        { value: "1.5 hr", label: "ساعة ونصف", price: 200 },
      ],
    });
    setIsDialogOpen(true);
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
      duration_options: [
        { value: "30 mins", label: "30 دقيقة", price: 100 },
        { value: "1 hr", label: "ساعة", price: 150 },
        { value: "1.5 hr", label: "ساعة ونصف", price: 200 },
      ],
    });
    setEditingService(null);
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
                    <Label htmlFor="image_url">صورة الخدمة *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="image_url"
                        value={formData.image_url}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        placeholder="رابط الصورة أو قم بالرفع"
                        required
                      />
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        {isUploading ? "جاري الرفع..." : "رفع"}
                      </Button>
                    </div>
                    {formData.image_url && (
                      <img
                        src={formData.image_url.startsWith('http') ? formData.image_url : getServiceImage(formData.image_url, formData.name)}
                        alt="معاينة"
                        className="w-full h-32 object-cover rounded-md mt-2"
                      />
                    )}
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
                  
                  <div className="grid gap-3 mt-4 border-t pt-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-base font-semibold">خيارات المدة والأسعار</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            duration_options: [
                              ...formData.duration_options,
                              { value: "", label: "", price: 0 }
                            ]
                          });
                        }}
                      >
                        <Plus className="w-4 h-4 ml-1" />
                        إضافة خيار
                      </Button>
                    </div>
                    {formData.duration_options.map((option, index) => (
                      <div key={index} className="grid grid-cols-[1fr,1fr,1fr,auto] gap-2 p-3 border rounded-lg bg-muted/30">
                        <div className="grid gap-1">
                          <Label className="text-xs">المدة</Label>
                          <Input
                            value={option.value}
                            onChange={(e) => {
                              const newOptions = [...formData.duration_options];
                              newOptions[index].value = e.target.value;
                              setFormData({ ...formData, duration_options: newOptions });
                            }}
                            placeholder="مثال: 30 mins"
                            className="h-9"
                          />
                        </div>
                        <div className="grid gap-1">
                          <Label className="text-xs">التسمية</Label>
                          <Input
                            value={option.label}
                            onChange={(e) => {
                              const newOptions = [...formData.duration_options];
                              newOptions[index].label = e.target.value;
                              setFormData({ ...formData, duration_options: newOptions });
                            }}
                            placeholder="مثال: 30 دقيقة"
                            className="h-9"
                          />
                        </div>
                        <div className="grid gap-1">
                          <Label className="text-xs">السعر (₪)</Label>
                          <Input
                            type="number"
                            value={option.price}
                            onChange={(e) => {
                              const newOptions = [...formData.duration_options];
                              newOptions[index].price = parseFloat(e.target.value) || 0;
                              setFormData({ ...formData, duration_options: newOptions });
                            }}
                            placeholder="100"
                            className="h-9"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (formData.duration_options.length > 1) {
                                const newOptions = formData.duration_options.filter((_, i) => i !== index);
                                setFormData({ ...formData, duration_options: newOptions });
                              } else {
                                toast({
                                  title: "تحذير",
                                  description: "يجب أن يكون هناك خيار واحد على الأقل",
                                  variant: "destructive",
                                });
                              }
                            }}
                            className="h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                            disabled={formData.duration_options.length === 1}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">
                    {editingService ? "حفظ التعديلات" : "إضافة"}
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
                        src={getServiceImage(service.image_url, service.name)}
                        alt={service.name}
                        className="w-16 h-16 object-cover rounded-md"
                        onError={(e) => { e.currentTarget.src = getServiceImage('', service.name); }}
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
