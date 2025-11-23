import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { useIsMobile } from "@/hooks/use-mobile";

interface Review {
  id: string;
  service_id: string;
  customer_name: string;
  rating: number;
  feedback: string | null;
  created_at: string;
}

interface Service {
  id: string;
  name: string;
  image_url: string;
}

export const LatestReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchServicesAndReviews();
  }, []);

  const fetchServicesAndReviews = async () => {
    try {
      // Fetch services
      const { data: servicesData, error: servicesError } = await supabase
        .from("services")
        .select("id, name, image_url")
        .eq("is_active", true);

      if (servicesError) throw servicesError;
      setServices(servicesData || []);

      // Fetch reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (reviewsError) throw reviewsError;
      setReviews(reviewsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getServiceName = (serviceId: string) => {
    return services.find(s => s.id === serviceId)?.name || serviceId;
  };

  const getServiceImage = (serviceId: string) => {
    return services.find(s => s.id === serviceId)?.image_url || "";
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
    );
  };

  if (isLoading || reviews.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4">آراء عملائنا</h2>
          <p className="text-base md:text-lg text-muted-foreground">
            اطلع على تجارب عملائنا مع خدماتنا
          </p>
        </div>

        {isMobile ? (
          <Carousel opts={{ align: "start", loop: true }} className="w-full max-w-6xl mx-auto">
            <CarouselContent className="-ml-2">
              {reviews.map((review) => (
                <CarouselItem key={review.id} className="pl-2 basis-4/5">
                  <Card className="hover:shadow-lg transition-shadow overflow-hidden h-full">
                    {getServiceImage(review.service_id) && (
                      <div className="h-24 overflow-hidden">
                        <img 
                          src={getServiceImage(review.service_id)} 
                          alt={getServiceName(review.service_id)}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardContent className="pt-4 p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm">{review.customer_name}</p>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3 h-3 ${
                                  star <= review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted-foreground"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium">{getServiceName(review.service_id)}</p>
                        {review.feedback && (
                          <p className="text-xs leading-relaxed line-clamp-3">{review.feedback}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString("ar-SA")}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {reviews.map((review) => (
              <Card key={review.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                {getServiceImage(review.service_id) && (
                  <div className="h-32 overflow-hidden">
                    <img 
                      src={getServiceImage(review.service_id)} 
                      alt={getServiceName(review.service_id)}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{review.customer_name}</p>
                      {renderStars(review.rating)}
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">{getServiceName(review.service_id)}</p>
                    {review.feedback && (
                      <p className="text-sm leading-relaxed">{review.feedback}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString("ar-SA")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
