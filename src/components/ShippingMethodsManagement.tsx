import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Trash2, Plus } from "lucide-react";

interface ShippingMethod {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
  created_at: string;
}

export const ShippingMethodsManagement = () => {
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [newMethodName, setNewMethodName] = useState("");
  const [newMethodPrice, setNewMethodPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchShippingMethods();
    
    const channel = supabase
      .channel('shipping-methods-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipping_methods' }, () => {
        fetchShippingMethods();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchShippingMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('shipping_methods')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShippingMethods(data || []);
    } catch (error) {
      console.error('Error fetching shipping methods:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل طرق الشحن",
        variant: "destructive",
      });
    }
  };

  const handleAddMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMethodName.trim() || !newMethodPrice || parseFloat(newMethodPrice) <= 0) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول بشكل صحيح",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('shipping_methods')
        .insert([{
          name: newMethodName.trim(),
          price: parseFloat(newMethodPrice),
          is_active: true,
        }]);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تمت إضافة طريقة الشحن",
      });

      setNewMethodName("");
      setNewMethodPrice("");
    } catch (error) {
      console.error('Error adding shipping method:', error);
      toast({
        title: "خطأ",
        description: "فشل في إضافة طريقة الشحن",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('shipping_methods')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم تحديث حالة طريقة الشحن",
      });
    } catch (error) {
      console.error('Error toggling shipping method:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث طريقة الشحن",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('shipping_methods')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم حذف طريقة الشحن",
      });
    } catch (error) {
      console.error('Error deleting shipping method:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف طريقة الشحن",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            إضافة طريقة شحن جديدة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddMethod} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="methodName">اسم طريقة الشحن</Label>
                <Input
                  id="methodName"
                  value={newMethodName}
                  onChange={(e) => setNewMethodName(e.target.value)}
                  placeholder="مثال: توصيل سريع"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="methodPrice">السعر (₪)</Label>
                <Input
                  id="methodPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newMethodPrice}
                  onChange={(e) => setNewMethodPrice(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              <Plus className="h-4 w-4 ml-2" />
              إضافة طريقة الشحن
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>طرق الشحن المتاحة</CardTitle>
        </CardHeader>
        <CardContent>
          {shippingMethods.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">لا توجد طرق شحن متاحة</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">اسم الطريقة</TableHead>
                  <TableHead className="text-right">السعر</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shippingMethods.map((method) => (
                  <TableRow key={method.id}>
                    <TableCell className="font-medium">{method.name}</TableCell>
                    <TableCell>{method.price.toFixed(2)} ₪</TableCell>
                    <TableCell>
                      <Badge variant={method.is_active ? "default" : "secondary"}>
                        {method.is_active ? "نشط" : "غير نشط"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(method.id, method.is_active)}
                        >
                          {method.is_active ? "إيقاف" : "تفعيل"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(method.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
