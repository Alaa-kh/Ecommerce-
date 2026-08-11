import type { Category, PlatziCategoryDto, PlatziProductDto, Product } from '@/shared/types/catalog';

function asIso(value: string | undefined): string | null {
  return value && value.length > 0 ? value : null;
}

function sanitizeImages(images: unknown): string[] {
  if (!Array.isArray(images)) return [];
  return images
    .filter((image): image is string => typeof image === 'string' && image.trim().length > 0)
    .map((image) => image.trim().replace(/^\[("|')?/, '').replace(/("|')?\]$/, ''));
}

export function mapCategory(dto: PlatziCategoryDto): Category {
  return {
    id: dto.id,
    name: dto.name,
    slug: dto.slug,
    imageUrl: dto.image,
    createdAt: asIso(dto.creationAt),
    updatedAt: asIso(dto.updatedAt),
  };
}

export function mapProduct(dto: PlatziProductDto): Product {
  return {
    id: dto.id,
    title: dto.title,
    slug: dto.slug,
    price: dto.price,
    description: dto.description,
    images: sanitizeImages(dto.images),
    category: mapCategory(dto.category),
    createdAt: asIso(dto.creationAt),
    updatedAt: asIso(dto.updatedAt),
  };
}

export function mapProducts(dtos: PlatziProductDto[]): Product[] {
  return dtos.map(mapProduct);
}

export function mapCategories(dtos: PlatziCategoryDto[]): Category[] {
  return dtos.map(mapCategory);
}
