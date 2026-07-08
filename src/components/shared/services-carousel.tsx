'use client';

import Carousel from 'react-bootstrap/Carousel';

export function ServicesCarousel({ folder, max, alt }: { folder: string; max: number; alt: string }) {
  const images = Array.from({ length: max }, (_, index) => `/assets/res/fotos/${folder}/${index + 1}.jpg`);

  return (
    <Carousel interval={5000} pause="hover">
      {images.map((image, index) => (
        <Carousel.Item key={image}>
          <img className="service-carousel-image" src={image} alt={`${alt} ${index + 1}`} />
        </Carousel.Item>
      ))}
    </Carousel>
  );
}
