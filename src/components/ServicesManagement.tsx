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

  const toggleActive = async (serviceId: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from("services")
        .update({ is_active: !currentState })
        .eq("id", serviceId);

      if (error) throw error;
      
      toast({
        title: "تم التحديث",
        description: currentState ? "تم إخفاء الخدمة" : "تم تفعيل الخدمة",
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
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit}>
                <DialogHeader className="pb-4">
                  <DialogTitle className="text-2xl">
                    {editingService ? "تعديل الخدمة" : "إضافة خدمة جديدة"}
                  </DialogTitle>
                  <DialogDescription>
                    قم بملء جميع الحقول المطلوبة (*) لإضافة أو تعديل الخدمة
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-6 py-6">
                  {/* Basic Info Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">المعلومات الأساسية</h3>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name" className="text-sm font-medium">اسم الخدمة *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="أدخل اسم الخدمة"
                          required
                          className="h-11"
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="description" className="text-sm font-medium">الوصف</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="وصف تفصيلي للخدمة"
                          rows={3}
                          className="resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Image Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">صورة الخدمة</h3>
                    <div className="grid gap-3">
                      <div className="flex gap-2">
                        <div className="flex-1 grid gap-2">
                          <Label htmlFor="image_url" className="text-sm font-medium">رابط الصورة *</Label>
                          <Input
                            id="image_url"
                            value={formData.image_url}
                            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                            placeholder="https://example.com/image.jpg أو قم برفع صورة"
                            required
                            className="h-11"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-sm font-medium opacity-0">رفع</Label>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept="image/*"
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="gap-2 h-11 min-w-[120px]"
                          >
                            <Upload className="w-4 h-4" />
                            {isUploading ? "جاري الرفع..." : "رفع صورة"}
                          </Button>
                        </div>
                      </div>
                      {formData.image_url && (
                        <div className="relative rounded-lg overflow-hidden border-2 border-border bg-muted">
                          <img
                            src={formData.image_url.startsWith('http') ? formData.image_url : getServiceImage(formData.image_url, formData.name)}
                            alt="معاينة الصورة"
                            className="w-full h-48 object-cover"
                          />
                          <Badge className="absolute top-2 right-2 bg-background/90">معاينة</Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Display Order Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">الإعدادات</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="currency" className="text-sm font-medium">العملة</Label>
                        <Input
                          id="currency"
                          value={formData.currency}
                          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                          className="h-11"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="display_order" className="text-sm font-medium">ترتيب العرض</Label>
                        <Input
                          id="display_order"
                          type="number"
                          min="0"
                          value={formData.display_order}
                          onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                          placeholder="1"
                          className="h-11"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Duration Options Section */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <h3 className="text-lg font-semibold">خيارات المدة والأسعار</h3>
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
                        className="gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        إضافة خيار جديد
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {formData.duration_options.map((option, index) => (
                        <div key={index} className="relative grid grid-cols-[1fr,1fr,120px,auto] gap-3 p-4 border-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                          <Badge variant="outline" className="absolute -top-2 right-3 bg-background text-xs">
                            خيار {index + 1}
                          </Badge>
                          <div className="grid gap-1.5">
                            <Label className="text-xs font-medium text-muted-foreground">المدة (بالإنجليزية)</Label>
                            <Input
                              value={option.value}
                              onChange={(e) => {
                                const newOptions = [...formData.duration_options];
                                newOptions[index].value = e.target.value;
                                setFormData({ ...formData, duration_options: newOptions });
                              }}
                              placeholder="30 mins"
                              className="h-10"
                            />
                          </div>
                          <div className="grid gap-1.5">
                            <Label className="text-xs font-medium text-muted-foreground">التسمية (بالعربية)</Label>
                            <Input
                              value={option.label}
                              onChange={(e) => {
                                const newOptions = [...formData.duration_options];
                                newOptions[index].label = e.target.value;
                                setFormData({ ...formData, duration_options: newOptions });
                              }}
                              placeholder="30 دقيقة"
                              className="h-10"
                            />
                          </div>
                          <div className="grid gap-1.5">
                            <Label className="text-xs font-medium text-muted-foreground">السعر (₪)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={option.price}
                              onChange={(e) => {
                                const newOptions = [...formData.duration_options];
                                newOptions[index].price = parseFloat(e.target.value) || 0;
                                setFormData({ ...formData, duration_options: newOptions });
                              }}
                              placeholder="100"
                              className="h-10"
                            />
                          </div>
                          <div className="grid gap-1.5">
                            <Label className="text-xs font-medium text-muted-foreground opacity-0">حذف</Label>
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
                              className="h-10 text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={formData.duration_options.length === 1}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {formData.duration_options.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                          <p className="text-sm">لا توجد خيارات مدة. انقر على "إضافة خيار جديد" لإضافة خيار.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                  >
                    إلغاء
                  </Button>
                  <Button type="submit" disabled={isLoading} className="gap-2">
                    {isLoading ? "جاري الحفظ..." : editingService ? "حفظ التعديلات" : "إضافة الخدمة"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">جاري التحميل...</p>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground mb-4">لا توجد خدمات حالياً</p>
            <Button
              onClick={() => setIsDialogOpen(true)}
              variant="outline"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              إضافة أول خدمة
            </Button>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-right font-semibold">الصورة</TableHead>
                  <TableHead className="text-right font-semibold">الاسم</TableHead>
                  <TableHead className="text-right font-semibold">الوصف</TableHead>
                  <TableHead className="text-right font-semibold">خيارات المدة والأسعار</TableHead>
                  <TableHead className="text-center font-semibold">الحالة</TableHead>
                  <TableHead className="text-center font-semibold">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id} className="hover:bg-muted/30">
                    <TableCell>
                      <img
                        src={getServiceImage(service.image_url, service.name)}
                        alt={service.name}
                        className="w-16 h-16 object-cover rounded-md border"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell className="max-w-xs">
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {service.description || "لا يوجد وصف"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {service.duration_options?.map((opt, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs font-medium">
                            {opt.label}: {opt.price} {service.currency}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(service.id, service.is_active)}
                        className={service.is_active ? "text-green-600 hover:text-green-700" : "text-gray-400 hover:text-gray-500"}
                      >
                        {service.is_active ? (
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span className="text-xs">نشط</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <EyeOff className="w-4 h-4" />
                            <span className="text-xs">معطل</span>
                          </div>
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(service)}
                          className="hover:bg-primary/10 hover:text-primary"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                              <AlertDialogDescription>
                                سيتم حذف الخدمة "{service.name}" بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(service.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                حذف
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
