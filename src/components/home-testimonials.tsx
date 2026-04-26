'use client';

import { useEffect, useState } from 'react';
import { getTestimonialsWithComments } from '@/app/actions/ratings';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

type Testimonial = {
  id: string;
  score: number;
  comment: string | null;
  student: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function StarRating({ score }: { score: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= score ? 'fill-amber-400 text-amber-400' : 'text-white/40'
          }`}
        />
      ))}
    </div>
  );
}

export default function HomeTestimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      const result = await getTestimonialsWithComments(6);
      if (result.success && result.data) {
        setTestimonials(result.data as Testimonial[]);
      }
      setIsLoading(false);
    };

    fetchTestimonials();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="animate-pulse text-slate-400">Carregando depoimentos...</div>
      </div>
    );
  }

  if (testimonials.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {testimonials.map((testimonial) => (
        <Card
          key={testimonial.id}
          className="border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300"
        >
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-amber-400">
                <AvatarImage src={testimonial.student.avatarUrl || undefined} />
                <AvatarFallback className="bg-amber-100 text-amber-700 text-sm font-bold">
                  {getInitials(testimonial.student.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-white text-sm">
                  {testimonial.student.name}
                </p>
                <StarRating score={testimonial.score} />
              </div>
            </div>
            <p className="text-white/80 text-sm italic leading-relaxed">
              "{testimonial.comment}"
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}