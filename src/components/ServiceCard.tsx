import { Card, CardContent } from "@/components/ui/card";
import massageImg from "@/assets/massage.jpg";
import hammamImg from "@/assets/hammam.jpg";
import skincareImg from "@/assets/skincare.jpg";

interface ServiceCardProps {
  title: string;
  description: string;
  image: string;
  price: string;
}

export const ServiceCard = ({ title, description, image, price }: ServiceCardProps) => {
  const getFallback = () => {
    if (title.includes('مساج')) return massageImg;
    if (title.includes('حمام')) return hammamImg;
    if (title.includes('عناية')) return skincareImg;
    return massageImg;
  };

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-[var(--shadow-card)] hover:-translate-y-1">
      <div className="aspect-square overflow-hidden">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => { e.currentTarget.src = getFallback(); }}
        />
      </div>
      <CardContent className="p-3 md:p-6 text-center">
        <h3 className="text-base md:text-xl font-bold mb-1 md:mb-2 text-foreground">{title}</h3>
        <p className="text-xs md:text-base text-muted-foreground mb-2 md:mb-3 leading-relaxed line-clamp-2">{description}</p>
        <p className="text-accent font-bold text-sm md:text-lg">{price}</p>
      </CardContent>
    </Card>
  );
};
