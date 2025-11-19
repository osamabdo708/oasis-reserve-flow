import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface ProductCardProps {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  price: number;
}

export const ProductCard = ({ id, name, description, image, price }: ProductCardProps) => {
  return (
    <Link to={`/product/${id}`}>
      <Card className="group overflow-hidden transition-all duration-300 hover:shadow-[var(--shadow-card)] hover:-translate-y-1 cursor-pointer">
        <div className="aspect-square overflow-hidden bg-muted">
          {image ? (
            <img 
              src={image} 
              alt={name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              لا توجد صورة
            </div>
          )}
        </div>
        <CardContent className="p-6 text-center">
          <h3 className="text-xl font-bold mb-2 text-foreground">{name}</h3>
          <p className="text-muted-foreground mb-3 leading-relaxed line-clamp-2">{description || "منتج مميز"}</p>
          <p className="text-accent font-bold text-lg">{price} ₪</p>
        </CardContent>
      </Card>
    </Link>
  );
};
