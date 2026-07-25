export type TryOnSave = {
  id: string;
  imageUrl: string;
  productTitle: string;
  productSlug?: string | null;
  productId?: string | null;
  productImageUrl?: string | null;
  createdAt: string;
};

export const TRYON_SAVES_MAX = 48;
export const TRYON_LOCAL_KEY = (userId: string) => `sp-tryon-saves:${userId}`;
